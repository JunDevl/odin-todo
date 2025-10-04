import "./default.css"; import "./sidebar.css"; import "./page.css";

import { Prettify, UUID, Priority, SelectionState, DutyType, DutyPrototype, Task, Project } from "./utils"

const Global = (() => {
  const tasks: Map<UUID, Task> = new Map();
  const projects: Map<UUID, Project> = new Map();

  if (!localStorage.getItem("tasks")) {
    const boilerPlateTasks: DutyPrototype[] = [
      {
        uuid: crypto.randomUUID(),
        type: "task",
        title: "Laundry",
        description: "Do the laundry"
      },
      {
        uuid: crypto.randomUUID(),
        type: "task",
        title: "Dishes",
        description: "Do the dishes"
      },
      {
        uuid: crypto.randomUUID(),
        type: "task",
        title: "Relationship Health",
        description: "Kiss wife"
      },
      {
        uuid: crypto.randomUUID(),
        type: "task",
        title: "Bill",
        description: "Pay the mechanic"
      },
      {
        uuid: crypto.randomUUID(),
        type: "task",
        title: "Git gud",
        description: "Evolve as a human being"
      },
      {
        uuid: crypto.randomUUID(),
        type: "task",
        title: "Control Finance",
        description: "Fill in your finance spreadsheet"
      },
      {
        uuid: crypto.randomUUID(),
        type: "task",
        title: "Devotional",
        description: "Reflect about life"
      },
    ]

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
      const target = e.target as HTMLButtonElement;
      const todo = document.querySelector<HTMLUListElement>("div.todo ul");

      const ava = new Task("asodfij");
      
      writeToDOM(ava, todo?.firstChild!);
    })
  })

  const todo = document.querySelector("div.todo ul");
  todo!.addEventListener("click", (e) => {
    const ev = e as MouseEvent;
    const target = e.target as HTMLElement
    const targetUUID = target.getAttribute("uuid") as UUID;

    if (!targetUUID) return;

    if (selectionState.origin !== targetUUID) {
      if (!ev.ctrlKey && !ev.shiftKey) {
        selectionState.selected.forEach((uuid) => {
          const previousSelected = document.querySelector(`div.todo ul li[uuid="${uuid}"]`);
          previousSelected?.removeAttribute("class");
        })
        selectionState.selected.clear();

        if (selectionState.origin) {
          const previousOrigin = document.querySelector("div.todo ul li.origin")
          previousOrigin?.removeAttribute("class");
        }

        selectionState.origin = targetUUID,
        selectionState.selected.add(targetUUID);

        target.classList.add("selected");
        target.classList.add("origin");

        return;
      }

      if (ev.ctrlKey && !ev.shiftKey) {
        const previousOrigin = document.querySelector(`div.todo ul li[uuid="${selectionState.origin}"]`);
        
        if (previousOrigin?.classList.contains("selected")) {
          previousOrigin?.classList.remove("origin");
        } else {
          previousOrigin?.removeAttribute("class");
        }
          

        selectionState.origin = targetUUID
        target.classList.add("origin");

        if (selectionState.selected.has(targetUUID)) {
          selectionState.selected.delete(targetUUID);

          target.classList.remove("selected");

          return;
        }

        selectionState.selected.add(targetUUID);

        target.classList.add("selected");

        return;
      }

      if (!ev.ctrlKey && ev.shiftKey) {
        const previousOrigin = document.querySelector("div.todo ul li.origin")

        console.dir(previousOrigin)
      }

      if (ev.ctrlKey && ev.shiftKey) {

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

      if (!ev.ctrlKey && ev.shiftKey) return;

      if (ev.ctrlKey && ev.shiftKey) {

      }
    }
  })

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

          writeToDOM(serializedTask);
          break;
        case "project":
          const serializedProject = new Project(childTasksUuid!, title, description, priority, deadline, uuid);

          insertDuty(serializedProject);

          writeToDOM(serializedProject);
          break;
      }
    }
  }
  
  return { insertDuty, getDuty, serializeDuty };
})()

function writeToDOM (duty: Task | Project, targetNode?: Node) {
  switch(duty.type) {
    case "task":
      const todo = document.querySelector<HTMLUListElement>("div.todo ul");

      const taskListElement = document.createElement("li");
      taskListElement.setAttribute("uuid", duty.uuid);

      const taskContainer = document.createElement("div");
      taskContainer.setAttribute("class", "task");

      const taskCheckbox = document.createElement("input");
      taskCheckbox.type = "checkbox";
      taskCheckbox.name = duty.description;
      taskCheckbox.id = duty.uuid;

      if (targetNode) {
        const taskLabel = document.createElement("label");
        taskLabel.setAttribute("for", duty.uuid);
        taskLabel.textContent = "TEST";

        taskContainer.appendChild(taskCheckbox);
        taskContainer.appendChild(taskLabel);

        taskListElement.appendChild(taskContainer);

        todo!.insertBefore(taskListElement, targetNode);

        return;
      }

      const taskLabel = document.createElement("label");
      taskLabel.setAttribute("for", duty.uuid);
      taskLabel.textContent = duty.description;

      taskContainer.appendChild(taskCheckbox);
      taskContainer.appendChild(taskLabel);

      taskListElement.appendChild(taskContainer);

      todo!.appendChild(taskListElement);
      break;
    
    case "project":

      break;
  }
}