import "./default.css";
import "./sidebar.css";
import "./page.css";

import "./components/list-base-visual.css";
import "./components/tasks/tasks.css";
import "./components/projects/projects.css";
import "./components/tracker/tracker.css";

import boilerplateNotes from "../resources/boilerplate-notes.json";
import boilerplateProjects from "../resources/boilerplate-projects.json";
import boilerplateTasks from "../resources/boilerplate-tasks.json";

import ConfigComponent from "./components/home-pages/config-page.html";
import ProjectsComponent from "./components/home-pages/projects-page.html";
import TodoComponent from "./components/home-pages/tasks-page.html";
import TrackerComponent from "./components/home-pages/tracker-page.html";

import writeProjectToDOM from "./components/projects/index";
import { writeTaskToDOM } from "./components/tasks/index";

import { handleInsertion, handleClick } from "./event-handlers";

import type { AppState, DutyPrototype, UUID } from "./utils";
import { Note, Page, Project, Task } from "./utils";

const State: AppState = {
	tasks: new Map(),
	projects: new Map(),
	notes: new Map(),

	page: Page.Tasks,

	observer: null,

	selection: {
		origin: null,
		selected: new Set(),
	},

	globalClickEvHandler: (e: MouseEvent) =>
		handleClick(e, "task", State.selection),

	insertionEvHandler: (e: MouseEvent) => handleInsertion(e, "task"),
};

export { State };

(() => {
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

	if (!localStorage.getItem("notes")) {
		const notes: DutyPrototype[] = (<unknown>(
			boilerplateNotes
		)) as DutyPrototype[];
		deserializeDuty(notes);
		localStorage.setItem("notes", JSON.stringify(notes));
	} else {
		deserializeDuty(
			JSON.parse(localStorage.getItem("notes") as string) as DutyPrototype[],
		);
	}

	if (!localStorage.getItem("tasks")) {
		const tasks: DutyPrototype[] = (<unknown>(
			boilerplateTasks
		)) as DutyPrototype[];
		deserializeDuty(tasks);
		localStorage.setItem("tasks", JSON.stringify(tasks));
	} else {
		deserializeDuty(
			JSON.parse(localStorage.getItem("tasks") as string) as DutyPrototype[],
		);
	}

	State.tasks.forEach((task) => {
		if (task.childTasks.length === 0) return;

		task.childTasks = task.childTasks.map((childTaskUUID) => {
			const childTask = State.tasks.get(childTaskUUID as UUID);
			(childTask as Task).parent = task;
			return childTask;
		}) as Task[];
	});

	if (!localStorage.getItem("projects")) {
		const projects: DutyPrototype[] = (<unknown>(
			boilerplateProjects
		)) as DutyPrototype[];
		deserializeDuty(projects);
		localStorage.setItem("projects", JSON.stringify(projects));
	} else {
		deserializeDuty(
			JSON.parse(localStorage.getItem("projects") as string) as DutyPrototype[],
		);
	}

	switchPage(State.page);

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

		if (State.observer) State.observer.disconnect();

		State.selection.origin = null;
		State.selection.selected.clear();

		const newContent = document.createElement("main");
		newContent.setAttribute("class", "content");
		document.body.appendChild(newContent);

		switch (page) {
			case Page.Tasks: {
				newContent.innerHTML = TodoComponent;

				const addTaskButton = document.querySelector<HTMLButtonElement>(
					"button.add",
				) as HTMLButtonElement;

				document.body.removeEventListener("click", State.globalClickEvHandler);

				State.globalClickEvHandler = (e: MouseEvent) =>
					handleClick(e, "task", State.selection);

				document.body.addEventListener("click", State.globalClickEvHandler);

				State.insertionEvHandler = (e: MouseEvent) =>
					handleInsertion(e, "task");

				addTaskButton.addEventListener("click", State.insertionEvHandler, {
					capture: true,
				});

				State.observer = generateObserver(
					document.querySelector("div.menu") as HTMLElement,
				);

				State.tasks.forEach((task) => {
					writeTaskToDOM(
						"append",
						document.querySelector<HTMLDivElement>("div#todo ul.container"),
						task,
					);
					const checkbox = document.querySelector<HTMLInputElement>(
						`div#todo ul.container li[uuid="${task.uuid}"] div.checkbox input[type="checkbox"]`,
					) as HTMLInputElement;
					checkbox.checked = !!task.completed;
				});

				State.page = Page.Tasks;

				break;
			}
			case Page.Projects: {
				newContent.setAttribute("class", "content");
				newContent.innerHTML = ProjectsComponent;

				const addProjectButton = document.querySelector<HTMLButtonElement>(
					"button.add",
				) as HTMLButtonElement;

				document.body.removeEventListener("click", State.globalClickEvHandler);

				State.globalClickEvHandler = (e: MouseEvent) =>
					handleClick(e, "project", State.selection);

				document.body.addEventListener("click", State.globalClickEvHandler);

				State.insertionEvHandler = (e: MouseEvent) =>
					handleInsertion(e, "project");

				addProjectButton.addEventListener("click", State.insertionEvHandler, {
					capture: true,
				});

				State.observer = generateObserver(
					document.querySelector("div.menu") as HTMLElement,
				);

				State.projects.forEach((project) => {
					writeProjectToDOM(
						"append",
						document.querySelector<HTMLDivElement>("div#projects ul.container"),
						project,
					);
				});

				State.page = Page.Projects;

				break;
			}
			case Page.Tracker:
				newContent.innerHTML = TrackerComponent;

				State.page = Page.Tracker;

				break;

			case Page.Configurations:
				newContent.innerHTML = ConfigComponent;

				State.page = Page.Configurations;

				break;
		}
	}

	function deserializeDuty(duties: DutyPrototype[]) {
		for (const duty of duties) {
			switch (duty.type) {
				case "task": {
					const serializedTask = new Task(duty);

					State.tasks.set(serializedTask.uuid, serializedTask);
					break;
				}
				case "project": {
					const serializedProject = new Project(duty);

					State.projects.set(serializedProject.uuid, serializedProject);
					break;
				}
				case "note": {
					const serializedNote = new Note(duty);

					State.notes.set(serializedNote.uuid, serializedNote);
				}
			}
		}
	}
})();
