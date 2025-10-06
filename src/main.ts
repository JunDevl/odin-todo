import "./default.css"; 
import "./sidebar.css"; 
import "./page.css";

import "./components/tasks/tasks.css";
import "./components/projects/projects.css"; 
import "./components/tracker/tracker.css"; 

import boilerplateTasks from "../resources/boilerplate-tasks.json";
import boilerplateProjects from "../resources/boilerplate-projects.json";

import TodoComponent from "./components/home-pages/tasks-page.html";
import ProjectsComponent from "./components/home-pages/projects-page.html";
import TrackerComponent from "./components/home-pages/tracker-page.html";
import ConfigComponent from "./components/home-pages/tracker-page.html";

import writeTaskToDOM from "./components/tasks/index";
import writeProjectToDOM from "./components/projects/index"

import { Prettify, UUID, Priority, Page, SelectionState, DutyType, DutyPrototype, Task, Project } from "./utils"
import { handleInsertion, handleItemSelection } from "./event-handlers";

const Global = (() => {
  const tasks: Map<UUID, Task> = new Map();
  const projects: Map<UUID, Project> = new Map();

  let currentPage: Page = Page.Tasks;

  const selectionState: SelectionState = {
      origin: null,
      selected: new Set(),
  }

  document.body.addEventListener("click", (e) => handleItemSelection(e, "task", selectionState));

  const sideOptions = document.querySelectorAll("nav.sidebar ul li");
  sideOptions.forEach((element) => {
    element.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;

      switch(target.textContent) {
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
  })

  let observer: IntersectionObserver | null = null;

  switchPage(Page.Tasks);

  if (!localStorage.getItem("tasks")) {
    const tasks: DutyPrototype[] = boilerplateTasks as DutyPrototype[];
    serializeDuty(tasks);
    localStorage.setItem("tasks", JSON.stringify(tasks));
  } 
  else { serializeDuty(JSON.parse(localStorage.getItem("tasks")!) as DutyPrototype[]); };

  if (!localStorage.getItem("projects")) {
    const projects: DutyPrototype[] = boilerplateProjects as DutyPrototype[];
    localStorage.setItem("projects", JSON.stringify(projects));
  }
  else { serializeDuty(JSON.parse(localStorage.getItem("projects")!) as DutyPrototype[]); }

  function generateObserver(observedElement: HTMLElement) {
    const observer = new IntersectionObserver(
      ([e]) => {
        let isSticky = false

        if (e.intersectionRect.top === e.rootBounds?.top) {
          isSticky = true
        }

        observedElement.dataset.currentlySticky = String(isSticky);
      },
      {
        rootMargin: "-15px 0px 0px 0px",
        threshold: [1],
      },
    )

    observer.observe(observedElement);
    return observer;
  }

  function switchPage(page: Page) {
    const content = document.querySelector<HTMLDivElement>("main.content");

    content!.replaceWith(content!.cloneNode(true)); // removes eventlisteners;
    if (observer) observer.disconnect();
    
    selectionState.origin = null;
    selectionState.selected.clear();

    const paintedElements = async (...HTMLElements: any[]): Promise<HTMLElement[]> => {
      const awaitedElements = await new Promise((resolve) => {
        if (!HTMLElements.includes(null)) resolve(HTMLElements)
      });
      return awaitedElements as any;
    }

    switch(page) {
      case Page.Tasks:
        content!.innerHTML = TodoComponent;

        paintedElements(document.querySelector("button.add"), document.querySelector("div.menu")).then((elements) => {
          const addTasksButton = elements[0] as HTMLButtonElement;
          const toolMenu = elements[1] as HTMLDivElement;
          
          addTasksButton.addEventListener("click", (e) => handleInsertion(e, "task", () => writeTaskToDOM));
          observer = generateObserver(toolMenu);
        });

        break;
      
      case Page.Projects:
        content!.innerHTML = ProjectsComponent;

        paintedElements(document.querySelector("button.add"), document.querySelector("div.menu")).then((elements) => {
          const addTasksButton = elements[0] as HTMLButtonElement;
          const toolMenu = elements[1] as HTMLDivElement;
          
          addTasksButton.addEventListener("click", (e) => handleInsertion(e, "project", () => writeTaskToDOM));
          observer = generateObserver(toolMenu);
        });

        break;
      
      case Page.Tracker:
        content!.innerHTML = TrackerComponent;

        break;
      
      case Page.Configurations:
        content!.innerHTML = ConfigComponent;

        break;
    }
  }

  function insertDuty (duty: Task | Project) {
    switch(duty.type) {
      case "task": tasks.set(duty.uuid, duty); break;
      case "project": projects.set(duty.uuid, duty); break;
    }
  }// I will eventually sin with the following import statements on this codebase, be aware.

  function getDuty (uuid: UUID, type: DutyType) {
    switch(type) {
      case "task": return tasks.get(uuid);
      case "project": return tasks.get(uuid);
    }
  }

  function serializeDuty (duties: DutyPrototype[]) {
    for (let duty of duties) {
      const { uuid, title, description, priority, deadline, parentProjectUuid, childTasksUuid } = duty;

      switch (duty.type) {
        case "task":
          const serializedTask = new Task(title, description, priority, deadline, parentProjectUuid, uuid);

          insertDuty(serializedTask);

          writeTaskToDOM(serializedTask, "append");
          break;
        case "project":
          const serializedProject = new Project(childTasksUuid!, title, description, priority, deadline, uuid);

          insertDuty(serializedProject);

          writeProjectToDOM(serializedProject, "append");
          break;
      }
    }
  }
  
  return { insertDuty, getDuty, serializeDuty };
})()