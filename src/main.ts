import "./style.css";

type Prettify<T> = {
  [k in keyof T]: T[k]
} & {}

type UUID = ReturnType<typeof crypto.randomUUID>

interface TaskProto {
  uuid: ReturnType<typeof crypto.randomUUID>;
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

const processTasks = (tasks: Omit<TaskProto, "uuid">[]) => {
  const writeToDOM = (task: Task) => {
    const todo = document.querySelector<HTMLUListElement>("div.todo ul");

    const taskListElement = document.createElement("li");
    taskListElement.setAttribute("uuid", task.uuid);

    const taskContainer = document.createElement("div");
    taskContainer.setAttribute("class", "task");

    const taskInput = document.createElement("input");
    taskInput.type = "checkbox";
    taskInput.name = task.description;
    taskInput.id = task.uuid;

    const taskLabel = document.createElement("label");
    taskLabel.setAttribute("for", task.uuid);
    taskLabel.textContent = task.description;

    taskContainer.appendChild(taskInput);
    taskContainer.appendChild(taskLabel);

    taskListElement.appendChild(taskContainer);

    todo!.appendChild(taskListElement);
  }

  for (let task of tasks) {
    const serializedTask = new Task(task.description, task.deadline);

    writeToDOM(serializedTask);
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
})()