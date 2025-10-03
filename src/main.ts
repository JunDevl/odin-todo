import "./default.css";
import "./sidebar.css";
import "./page.css";

type Prettify<T> = {
  [k in keyof T]: T[k]
} & {}

type UUID = ReturnType<typeof crypto.randomUUID>

type Priority = "low" | "medium" | "high";

let defaultPriority: Priority = "medium";

interface DutyPrototype {
  readonly uuid: UUID;
  title?: string; // TO-DO: implement this
  description?: string;
  priority?: "low" | "medium" | "high" // TO-DO: implement this
  deadline?: Date;
}

class Task implements DutyPrototype{
  title: string;
  description: string;
  priority: Priority;
  deadline?: Date;
  readonly uuid: UUID;

  constructor(title?: string, 
              description?: string, 
              priority?: Priority, 
              deadline?: Date, 
              uuid?: UUID) 
  {
    this.title = title ? title : "";
    this.description = description ? description : "";
    this.priority = priority ? priority : defaultPriority;
    if (deadline) this.deadline = deadline;
    this.uuid = uuid ? uuid : crypto.randomUUID();
  }
}

class Project implements DutyPrototype{
  title: string;
  description: string;
  priority: Priority;
  tasks: Task[];
  deadline?: Date;
  readonly uuid: UUID;

  constructor(tasks: Task[],
              title?: string,  
              description?: string, 
              priority?: Priority, 
              deadline?: Date, 
              uuid?: UUID) 
  {              
    this.tasks = tasks;
    this.title = title ? title : "";
    this.description = description ? description : "";
    this.priority = priority ? priority : defaultPriority;
    if (deadline) this.deadline = deadline;
    this.uuid = uuid ? uuid : crypto.randomUUID();
  }
}

const writeTaskToDOM = (task: Task, targetTaskNode?: Node) => {
  const todo = document.querySelector<HTMLUListElement>("div.todo ul");

  const taskListElement = document.createElement("li");
  taskListElement.setAttribute("uuid", task.uuid);

  const taskContainer = document.createElement("div");
  taskContainer.setAttribute("class", "task");

  const taskCheckbox = document.createElement("input");
  taskCheckbox.type = "checkbox";
  taskCheckbox.name = task.description;
  taskCheckbox.id = task.uuid;

  if (targetTaskNode) {
    const taskLabel = document.createElement("label");
    taskLabel.setAttribute("for", task.uuid);
    taskLabel.textContent = "TEST";

    taskContainer.appendChild(taskCheckbox);
    taskContainer.appendChild(taskLabel);

    taskListElement.appendChild(taskContainer);

    todo!.insertBefore(taskListElement, targetTaskNode);

    return;
  }

  const taskLabel = document.createElement("label");
  taskLabel.setAttribute("for", task.uuid);
  taskLabel.textContent = task.description;

  taskContainer.appendChild(taskCheckbox);
  taskContainer.appendChild(taskLabel);

  taskListElement.appendChild(taskContainer);

  todo!.appendChild(taskListElement);
}

const writeProjectToDOM = (project: Project, targetProjectNode?: Node) => {
  const projects = document.querySelector<HTMLUListElement>("div.projects ul");

  const projectListElement = document.createElement("li");
  projectListElement.setAttribute("uuid", project.uuid);
  projectListElement.tabIndex = 0;

  const projectContainer = document.createElement("div");
  projectContainer.setAttribute("class", "project");

  const projectCheckbox = document.createElement("input");
  projectCheckbox.type = "checkbox";
  projectCheckbox.name = project.description;
  projectCheckbox.id = project.uuid;
  projectCheckbox.tabIndex = -1;

  if (targetProjectNode) {
    const projectLabel = document.createElement("label");
    projectLabel.setAttribute("for", project.uuid);
    projectLabel.textContent = "TEST";

    projectContainer.appendChild(projectCheckbox);
    projectContainer.appendChild(projectLabel);

    projectListElement.appendChild(projectContainer);

    projects!.insertBefore(projectListElement, targetProjectNode);

    return;
  }

  const projectLabel = document.createElement("label");
  projectLabel.setAttribute("for", project.uuid);
  projectLabel.textContent = project.description;

  projectContainer.appendChild(projectCheckbox);
  projectContainer.appendChild(projectLabel);

  projectListElement.appendChild(projectContainer);

  projects!.appendChild(projectListElement);
}

const processTasks = (tasks: Omit<DutyPrototype, "uuid">[]) => {
  for (let task of tasks) {
    const { title, description, priority, deadline } = task;
    const serializedTask = new Task(title, description, priority, deadline);

    writeTaskToDOM(serializedTask);
  }
}

(() => {
  if (!localStorage.getItem("tasks")) {
    const boilerPlateTasks: DutyPrototype[] = [
      {
        uuid: crypto.randomUUID(),
        title: "Do the laundry"
      },
      {
        uuid: crypto.randomUUID(),
        description: "Do the dishes"
      },
      {
        uuid: crypto.randomUUID(),
        description: "Kiss wife"
      },
      {
        uuid: crypto.randomUUID(),
        description: "Pay the mechanic"
      },
      {
        uuid: crypto.randomUUID(),
        description: "Evolve as a human being"
      },
      {
        uuid: crypto.randomUUID(),
        description: "Fill in your finance spreadsheet"
      },
      {
        uuid: crypto.randomUUID(),
        description: "Reflect about life"
      },
    ]

    processTasks(boilerPlateTasks);

    localStorage.setItem("tasks", JSON.stringify(boilerPlateTasks));

    return;
  };

  const tasks = JSON.parse(localStorage.getItem("tasks")!) as DutyPrototype[];

  processTasks(tasks);

  document.querySelectorAll("button.add")?.forEach((buttonElement) => {
    buttonElement.addEventListener("click", (e) => {
      const target = e.target as HTMLButtonElement;
      const todo = document.querySelector<HTMLUListElement>("div.todo ul");

      const ava = new Task("asodfij");
      
      writeTaskToDOM(ava, todo?.firstChild!);
    })
  })

  type SelectionState = { 
    origin: HTMLElement | null; 
    selected: HTMLElement[]; 
    current: HTMLElement | null 
  }

  const selectionState: SelectionState = {
    origin: null,
    selected: [],
    current: null
  }

  document.querySelector("div.todo ul")?.addEventListener("click", (e) => {
    const ev = e as MouseEvent;
    const target = ev.target as HTMLElement;

    if (!target.getAttribute("uuid")) return;

    // TO-DO: implement selection logic

    if (selectionState.current === target) {
      selectionState.origin = target;
      selectionState.selected.push(target);
      selectionState.current = target;

      target.classList.add("selected");
      target.classList.add("current");
      target.classList.add("origin");

      return;
    }

    selectionState.origin = target;
    selectionState.selected.push(target);
    selectionState.current = target;

    target.classList.add("selected");
    target.classList.add("current");
    target.classList.add("origin");

  })
})()