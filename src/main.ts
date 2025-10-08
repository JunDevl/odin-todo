import "./default.css";
import "./sidebar.css";
import "./page.css";

import "./components/tasks/tasks.css";
import "./components/projects/projects.css";
import "./components/tracker/tracker.css";

import boilerplateProjects from "../resources/boilerplate-projects.json";
import boilerplateTasks from "../resources/boilerplate-tasks.json";
import ConfigComponent from "./components/home-pages/config-page.html";
import ProjectsComponent from "./components/home-pages/projects-page.html";
import TodoComponent from "./components/home-pages/tasks-page.html";
import TrackerComponent from "./components/home-pages/tracker-page.html";

import writeProjectToDOM from "./components/projects/index";
import writeTaskToDOM from "./components/tasks/index";

import { handleInsertion, handleItemSelection } from "./event-handlers";

import type {
	DutyPrototype,
	DutyType,
	Prettify,
	Priority,
	SelectionState,
	UUID,
} from "./utils";
import { Page, Project, Task } from "./utils";

const Global = (() => {
	const tasks: Map<UUID, Task> = new Map();
	const projects: Map<UUID, Project> = new Map();

	const selectionState: SelectionState = {
		origin: null,
		selected: new Set(),
	};

	let currentPage = Page.Tasks;

	let observer: IntersectionObserver | null = null;

	let currentSelectionHandler = (e: MouseEvent) =>
		handleItemSelection(e, "task", selectionState);

	const sideOptions = document.querySelectorAll("nav.sidebar ul li button");
	sideOptions.forEach((element) => {
		element.addEventListener("click", (e) => {
			const target = e.target as HTMLElement;

			switch (target.textContent) {
				case "Tasks":
					switchPage(Page.Tasks);
					break;
				case "Projects":
					switchPage(Page.Projects);
					break;
				case "Tracker":
					switchPage(Page.Tracker);
					break;
				case "Configurations":
					switchPage(Page.Configurations);
					break;
			}
		});
	});

	if (!localStorage.getItem("tasks")) {
		const tasks: DutyPrototype[] = boilerplateTasks as DutyPrototype[];
		deserializeDuty(tasks);
		localStorage.setItem("tasks", JSON.stringify(tasks));
	} else {
		deserializeDuty(
			JSON.parse(localStorage.getItem("tasks") as string) as DutyPrototype[],
		);
	}

	if (!localStorage.getItem("projects")) {
		const projects: DutyPrototype[] = boilerplateProjects as DutyPrototype[];
		deserializeDuty(projects);
		localStorage.setItem("projects", JSON.stringify(projects));
	} else {
		deserializeDuty(
			JSON.parse(localStorage.getItem("projects") as string) as DutyPrototype[],
		);
	}

	switchPage(currentPage);

	function generateObserver(observedElement: HTMLElement) {
		const observer = new IntersectionObserver(
			([e]) => {
				let isSticky = false;

				if (e.intersectionRect.top === e.rootBounds?.top) {
					isSticky = true;
				}

				observedElement.dataset.currentlySticky = String(isSticky);
			},
			{
				rootMargin: "-15px 0px 0px 0px",
				threshold: [1],
			},
		);

		observer.observe(observedElement);
		return observer;
	}

	function switchPage(page: Page) {
		const previousContent =
			document.querySelector<HTMLDivElement>("main.content");
		if (previousContent) document.body.removeChild(previousContent);

		if (observer) observer.disconnect();

		selectionState.origin = null;
		selectionState.selected.clear();

		const newContent = document.createElement("main");
		newContent.setAttribute("class", "content");
		document.body.appendChild(newContent);

		switch (page) {
			case Page.Tasks: {
				newContent.innerHTML = TodoComponent;

				const addTaskButton =
					document.querySelector<HTMLButtonElement>("button.add");

				document.removeEventListener("click", currentSelectionHandler);

				currentSelectionHandler = (e) =>
					handleItemSelection(e, "task", selectionState);

				document.addEventListener("click", currentSelectionHandler);

				if (addTaskButton)
					addTaskButton.addEventListener("click", (e) =>
						handleInsertion(e, "task", () => writeTaskToDOM),
					);

				observer = generateObserver(
					document.querySelector("div.menu") as HTMLElement,
				);

				tasks.forEach((task) => {
					writeTaskToDOM(
						task,
						"append",
						document.querySelector<HTMLDivElement>("div#todo ul.container"),
					);
				});

				currentPage = Page.Tasks;

				break;
			}
			case Page.Projects: {
				newContent.setAttribute("class", "content");
				newContent.innerHTML = ProjectsComponent;

				const addProjectButton =
					document.querySelector<HTMLButtonElement>("button.add");

				document.removeEventListener("click", currentSelectionHandler);

				currentSelectionHandler = (e) =>
					handleItemSelection(e, "project", selectionState);

				document.addEventListener("click", currentSelectionHandler);

				if (addProjectButton)
					addProjectButton.addEventListener("click", (e) =>
						handleInsertion(e, "project", () => writeProjectToDOM),
					);

				observer = generateObserver(
					document.querySelector("div.menu") as HTMLElement,
				);

				projects.forEach((project) => {
					writeProjectToDOM(
						project,
						"append",
						document.querySelector<HTMLDivElement>("div#projects ul.container"),
					);
				});

				currentPage = Page.Projects;

				break;
			}
			case Page.Tracker:
				newContent.innerHTML = TrackerComponent;

				currentPage = Page.Tracker;

				break;

			case Page.Configurations:
				newContent.innerHTML = ConfigComponent;

				currentPage = Page.Configurations;

				break;
		}
	}

	function insertDuty(duty: Task | Project) {
		switch (duty.type) {
			case "task":
				tasks.set(duty.uuid, duty);
				break;
			case "project":
				projects.set(duty.uuid, duty);
				break;
		}
	}

	function getDuty(uuid: UUID, type: DutyType) {
		switch (type) {
			case "task":
				return tasks.get(uuid);
			case "project":
				return tasks.get(uuid);
		}
	}

	function deserializeDuty(duties: DutyPrototype[]) {
		for (const duty of duties) {
			switch (duty.type) {
				case "task": {
					const serializedTask = new Task(duty);

					insertDuty(serializedTask);
					break;
				}
				case "project": {
					const serializedProject = new Project(duty);

					insertDuty(serializedProject);
					break;
				}
			}
		}
	}

	function filterTargetDuty(
		target: Task | Project,
	): Project | Task[] | undefined {
		if (target.type === "task") {
			return target.parentProjectUuid
				? projects.get(target.parentProjectUuid)
				: undefined;
		}

		return target.childTasksUuid.length > 0
			? target.childTasksUuid.map((taskUuid) => <Task>tasks.get(taskUuid))
			: [];
	}

	return { filterTargetDuty };
})();

export default Global;
