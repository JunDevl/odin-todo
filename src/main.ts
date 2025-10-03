import "./default.css";
import "./sidebar.css";
import "./page.css";

type Prettify<T> = {
  [k in keyof T]: T[k]
} & {}

type UUID = ReturnType<typeof crypto.randomUUID>

interface TaskProto {
  uuid: UUID;
  //title: string; // TO-DO: implement this
  description: string;
  deadline?: Date;
  //priority: "low" | "medium" | "high" // TO-DO: implement this
}

class Task implements TaskProto{
  uuid: UUID;
  description: string;
  deadline?: Date;

  constructor(description: string, deadline?: Date, uuid?: UUID) {
    this.uuid = uuid ? uuid : crypto.randomUUID();

    this.description = description;

    if (deadline) this.deadline = deadline;
  }
}

const writeTaskToDOM = (task: Task, targetTaskNode?: Node) => {
  const todo = document.querySelector<HTMLUListElement>("div.todo ul");

  const taskListElement = document.createElement("li");
  taskListElement.setAttribute("uuid", task.uuid);
  taskListElement.tabIndex = 0;

  const taskContainer = document.createElement("div");
  taskContainer.setAttribute("class", "task");

  const taskCheckbox = document.createElement("input");
  taskCheckbox.type = "checkbox";
  taskCheckbox.name = task.description;
  taskCheckbox.id = task.uuid;
  taskCheckbox.tabIndex = -1;

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

const processTasks = (tasks: Omit<TaskProto, "uuid">[]) => {
  for (let task of tasks) {
    const serializedTask = new Task(task.description, task.deadline);

    writeTaskToDOM(serializedTask);
  }
}

(() => {
  if (!localStorage.getItem("tasks")) {
    const boilerPlateTasks: TaskProto[] = [
      {
        uuid: crypto.randomUUID(),
        description: "Do the laundry"
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

  const tasks = JSON.parse(localStorage.getItem("tasks")!) as TaskProto[];

  processTasks(tasks);

  document.querySelectorAll("button.add")?.forEach((buttonElement) => {
    buttonElement.addEventListener("click", (e) => {
      const target = e.target as HTMLButtonElement;
      const todo = document.querySelector<HTMLUListElement>("div.todo ul");

      const ava = new Task("asodfij");
      
      writeTaskToDOM(ava, todo?.firstChild!);
    })
  })
})()