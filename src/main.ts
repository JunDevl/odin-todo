import "./default.css";
import "./sidebar.css";
import "./page.css";

import "./components/list-base-visual.css";
import "./components/tasks/tasks.css";
import "./components/projects/projects.css";
import "./components/tracker/tracker.css";

import ConfigComponent from "./components/home-pages/config-page.html";
import ProjectsComponent from "./components/home-pages/projects-page.html";
import TodoComponent from "./components/home-pages/tasks-page.html";
import TrackerComponent from "./components/home-pages/tracker-page.html";

import writeProject from "./components/projects/index";
import { writeTask } from "./components/tasks/index";
import { EntitiesMap } from "./utils/entities";
import { handleInsertion, handleItemSelection } from "./utils/event-handlers";
import type { AppState } from "./utils/types";
import { Page } from "./utils/types";

const State: AppState = {
	tasks: new EntitiesMap("task"),
	projects: new EntitiesMap("project"),
	notes: new EntitiesMap("note"),

	page: Page.Tasks,

	menuObserver: null,

	itemSelection: {
		origin: null,
		selected: new Set(),
	},

	defaultDutyPriority: "medium",

	itemSelectionEvHandler: (e: MouseEvent) =>
		handleItemSelection(e, "task", State.itemSelection),

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

		if (State.menuObserver) State.menuObserver.disconnect();

		State.itemSelection.origin = null;
		State.itemSelection.selected.clear();

		const newContent = document.createElement("main");
		newContent.setAttribute("class", "content");
		document.body.appendChild(newContent);

		switch (page) {
			case Page.Tasks: {
				newContent.innerHTML = TodoComponent;

				const addTaskButton = document.querySelector<HTMLButtonElement>(
					"button.add",
				) as HTMLButtonElement;

				document.body.removeEventListener(
					"click",
					State.itemSelectionEvHandler,
				);

				State.itemSelectionEvHandler = (e: MouseEvent) =>
					handleItemSelection(e, "task", State.itemSelection);

				document.body.addEventListener("click", State.itemSelectionEvHandler);

				State.insertionEvHandler = (e: MouseEvent) =>
					handleInsertion(e, "task");

				addTaskButton.addEventListener("click", State.insertionEvHandler, {
					capture: true,
				});

				State.menuObserver = generateObserver(
					document.querySelector("div.menu") as HTMLElement,
				);

				State.tasks.forEach((task) => {
					writeTask(
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

				document.body.removeEventListener(
					"click",
					State.itemSelectionEvHandler,
				);

				State.itemSelectionEvHandler = (e: MouseEvent) =>
					handleItemSelection(e, "project", State.itemSelection);

				document.body.addEventListener("click", State.itemSelectionEvHandler);

				State.insertionEvHandler = (e: MouseEvent) =>
					handleInsertion(e, "project");

				addProjectButton.addEventListener("click", State.insertionEvHandler, {
					capture: true,
				});

				State.menuObserver = generateObserver(
					document.querySelector("div.menu") as HTMLElement,
				);

				State.projects.forEach((project) => {
					writeProject(
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
})();
