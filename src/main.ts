import "./default.css"; 
import "./sidebar.css"; 
import "./page.css";

import "./components/tasks/tasks.css";
import "./components/projects/projects.css"; 
import "./components/tracker/tracker.css"; 

import boilerplate from "../resources/boilerplate.json";

// I will eventually sin with the following import statements on this codebase, be aware.
import writeTaskToDOM from "./components/tasks/index";
import writeProjectToDOM from "./components/projects/index"

import { Prettify, UUID, Priority, SelectionState, DutyType, DutyPrototype, Task, Project } from "./utils"

const Global = (() => {

  const tasks: Map<UUID, Task> = new Map();
  const projects: Map<UUID, Project> = new Map();

  if (!localStorage.getItem("tasks")) {
    const boilerPlateTasks: DutyPrototype[] = boilerplate as DutyPrototype[]

    serializeDuty(boilerPlateTasks);

    localStorage.setItem("tasks", JSON.stringify(boilerPlateTasks));

    return;
  };

  const cachedTasks = JSON.parse(localStorage.getItem("tasks")!) as DutyPrototype[];

  serializeDuty(cachedTasks);

  const selectionState: SelectionState = {
    origin: null,
    selected: new Set(),
  }

  const addButtons = document.querySelectorAll("button.add");
  addButtons.forEach((buttonElement) => {
    buttonElement.addEventListener("click", (e) => {
      const test = new Task();

      tasks.set(test.uuid, test);
      
      writeTaskToDOM(test, "insert");
    })
  })

  document.body.addEventListener("click", (e) => {
    const ev = e as MouseEvent;
    const target = e.target as HTMLElement
    const targetUUID = target.getAttribute("uuid") as UUID;

    if (!targetUUID) {
      const selectedElements = document.querySelectorAll("div.todo ul li")

      selectedElements.forEach((el) => el.removeAttribute("class"));

      selectionState.origin = null;
      selectionState.selected.clear();


      return;
    };

    if (selectionState.origin !== targetUUID) {
      if (!ev.ctrlKey && !ev.shiftKey) {
        selectionState.selected.forEach((uuid) => {
          const previousSelected = document.querySelector(`div.todo ul li[uuid="${uuid}"]`);
          previousSelected?.removeAttribute("class");
        })
        selectionState.selected.clear();

        if (selectionState.origin) {
          const previousOrigin = document.querySelector("div.todo ul li.origin-selection")
          previousOrigin?.removeAttribute("class");
        }

        selectionState.origin = targetUUID,
        selectionState.selected.add(targetUUID);

        target.classList.add("selected");
        target.classList.add("origin-selection");

        return;
      }

      if (ev.ctrlKey && !ev.shiftKey) {
        const previousOrigin = document.querySelector(`div.todo ul li[uuid="${selectionState.origin}"]`);
        
        if (previousOrigin?.classList.contains("selected")) {
          previousOrigin?.classList.remove("origin-selection");
        } else {
          previousOrigin?.removeAttribute("class");
        }
          

        selectionState.origin = targetUUID
        target.classList.add("origin-selection");

        if (selectionState.selected.has(targetUUID)) {
          selectionState.selected.delete(targetUUID);

          target.classList.remove("selected");

          return;
        }

        selectionState.selected.add(targetUUID);

        target.classList.add("selected");

        return;
      }
    } 
    
    if (selectionState.origin === targetUUID) {
      if (!ev.ctrlKey && !ev.shiftKey) {
        if (selectionState.selected.size !== 0) {
          selectionState.selected.forEach((uuid) => {
            const previousSelected = document.querySelector(`div.todo ul li[uuid="${uuid}"]`);
            if (uuid !== targetUUID) previousSelected?.removeAttribute("class");
          })
          selectionState.selected.clear();
        }

        target.classList.toggle("selected");

        return;
      }

      if (ev.ctrlKey && !ev.shiftKey) {
        if (selectionState.selected.has(targetUUID)) {
          selectionState.selected.delete(targetUUID);

          target.classList.remove("selected");

          return;
        }

        selectionState.selected.add(targetUUID);

        target.classList.add("selected");

        return;
      }
    }
  })

  const el = document.querySelector("div.menu") as HTMLElement;
  const observer = new IntersectionObserver(
    ([e]) => {
      let isSticky = false

      if (e.intersectionRect.top === e.rootBounds?.top) {
        isSticky = true
      }

      el.dataset.currentlySticky = String(isSticky)
    },
    {
      rootMargin: "-15px 0px 0px 0px",
      threshold: [1],
    },
  )

  observer.observe(el!);

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