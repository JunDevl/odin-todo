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
    const previousContent = document.querySelector<HTMLDivElement>("main.content");
    document.body.removeChild(previousContent!);

    if (observer) observer.disconnect();
    
    selectionState.origin = null;
    selectionState.selected.clear();

    const newContent = document.createElement("main");
    newContent.setAttribute("class", "content");
    document.body.appendChild(newContent);

    switch(page) {
      case Page.Tasks:
        newContent.innerHTML = TodoComponent;
        
        const addTaskButton = document.querySelector("button.add");

        addTaskButton!.addEventListener("click", (e) => handleInsertion(e, "task", () => writeTaskToDOM));
        observer = generateObserver(document.querySelector("div.menu") as HTMLElement);

        tasks.forEach((task) => { writeTaskToDOM(task, "append"); })

        break;
      
      case Page.Projects:
        newContent.setAttribute("class", "content");
        newContent.innerHTML = ProjectsComponent;

        const addProjectButton = document.querySelector("button.add");

        addProjectButton!.addEventListener("click", (e) => handleInsertion(e, "task", () => writeProjectToDOM));
        observer = generateObserver(document.querySelector("div.menu") as HTMLElement);

        projects.forEach((project) => { writeProjectToDOM(project, "append"); })

        break;
      
      case Page.Tracker:
        newContent.innerHTML = TrackerComponent;

        break;
      
      case Page.Configurations:
        newContent.innerHTML = ConfigComponent;

        break;
    }
  }

  function insertDuty (duty: Task | Project) {
    switch(duty.type) {
      case "task": tasks.set(duty.uuid, duty); break;
      case "project": projects.set(duty.uuid, duty); break;
    }
  }

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