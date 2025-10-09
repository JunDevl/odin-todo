import "./default.css";
import "./sidebar.css";
import "./page.css";

import "./components/list-base-visual.css";
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
	AppState,
	DutyPrototype,
	DutyType,
	Prettify,
	Priority,
	SelectionState,
	UUID,
} from "./utils";
import { Page, Project, Task } from "./utils";

const State: AppState = {
	storedTasks: new Map(),
	storedProjects: new Map(),

	currentSelection: {
		origin: null,
		selected: new Set(),
	},

	currentPage: Page.Tasks,

	currentObserver: null,

	currentItemSelectionEventHandler: (e: MouseEvent) => {},
};

(() => {
	State.currentItemSelectionEventHandler = (e: MouseEvent) =>
		handleItemSelection(e, "task", State.currentSelection, getDuty);

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

	switchPage(State.currentPage);

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

		if (State.currentObserver) State.currentObserver.disconnect();

		State.currentSelection.origin = null;
		State.currentSelection.selected.clear();

		const newContent = document.createElement("main");
		newContent.setAttribute("class", "content");
		document.body.appendChild(newContent);

		switch (page) {
			case Page.Tasks: {
				newContent.innerHTML = TodoComponent;

				const addTaskButton =
					document.querySelector<HTMLButtonElement>("button.add");

				document.removeEventListener(
					"click",
					State.currentItemSelectionEventHandler,
				);

				State.currentItemSelectionEventHandler = (e) =>
					handleItemSelection(e, "task", State.currentSelection, getDuty);

				document.addEventListener(
					"click",
					State.currentItemSelectionEventHandler,
				);

				if (addTaskButton)
					addTaskButton.addEventListener("click", (e) =>
						handleInsertion(e, "task", () => writeTaskToDOM),
					);

				State.currentObserver = generateObserver(
					document.querySelector("div.menu") as HTMLElement,
				);

				State.storedTasks.forEach((task) => {
					writeTaskToDOM(
						task,
						"append",
						document.querySelector<HTMLDivElement>("div#todo ul.container"),
					);
					const checkbox = document.querySelector<HTMLInputElement>(
						`div#todo ul.container li[uuid="${task.uuid}"] div.checkbox input[type="checkbox"]`,
					) as HTMLInputElement;
					checkbox.checked = !!task.completed;
				});

				State.currentPage = Page.Tasks;

				break;
			}
			case Page.Projects: {
				newContent.setAttribute("class", "content");
				newContent.innerHTML = ProjectsComponent;

				const addProjectButton =
					document.querySelector<HTMLButtonElement>("button.add");

				document.removeEventListener(
					"click",
					State.currentItemSelectionEventHandler,
				);

				State.currentItemSelectionEventHandler = (e) =>
					handleItemSelection(e, "project", State.currentSelection, getDuty);

				document.addEventListener(
					"click",
					State.currentItemSelectionEventHandler,
				);

				if (addProjectButton)
					addProjectButton.addEventListener("click", (e) =>
						handleInsertion(e, "project", () => writeProjectToDOM),
					);

				State.currentObserver = generateObserver(
					document.querySelector("div.menu") as HTMLElement,
				);

				State.storedProjects.forEach((project) => {
					writeProjectToDOM(
						project,
						"append",
						document.querySelector<HTMLDivElement>("div#projects ul.container"),
					);
				});

				State.currentPage = Page.Projects;

				break;
			}
			case Page.Tracker:
				newContent.innerHTML = TrackerComponent;

				State.currentPage = Page.Tracker;

				break;

			case Page.Configurations:
				newContent.innerHTML = ConfigComponent;

				State.currentPage = Page.Configurations;

				break;
		}
	}

	function insertDuty(duty: Task | Project) {
		switch (duty.type) {
			case "task":
				State.storedTasks.set(duty.uuid, duty);
				break;
			case "project":
				State.storedProjects.set(duty.uuid, duty);
				break;
		}
	}

	function getDuty(uuid: UUID, type: DutyType) {
		switch (type) {
			case "task":
				return State.storedTasks.get(uuid);
			case "project":
				return State.storedTasks.get(uuid);
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
				? State.storedProjects.get(target.parentProjectUuid)
				: undefined;
		}

		return target.childTasksUuid.length > 0
			? target.childTasksUuid.map(
					(taskUuid) => <Task>State.storedTasks.get(taskUuid),
				)
			: [];
	}

	return { filterTargetDuty };
})();

export default State;
