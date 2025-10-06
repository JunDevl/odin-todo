export type Prettify<T> = {
  [k in keyof T]: T[k]
} & {}

export type UUID = ReturnType<typeof crypto.randomUUID>

export type Priority = "low" | "medium" | "high";

export type DutyType = "task" | "project";

export enum Page {
  Tasks,
  Projects,
  Tracker,
  Configurations
};

let defaultPriority: Priority = "medium";

export type SelectionState = { 
    origin: UUID | null;
    selected: Set<UUID>;
}

export interface DutyPrototype {
  readonly type: DutyType;
  readonly uuid: UUID;
  title?: string; // TO-DO: implement this
  description?: string;
  priority?: Priority // TO-DO: implement this
  deadline?: Date;

  parentProjectUuid?: UUID; // Exclusively implemented by Tasks class
  childTasksUuid?: UUID[]; // Excluively implemented by Projects class
}

export class Task implements DutyPrototype {
  readonly type = "task";
  title: string;
  description: string;
  priority: Priority;
  deadline?: Date;
  parentProjectUuid?: UUID;
  readonly uuid: UUID;

  constructor(title?: string, 
              description?: string, 
              priority?: Priority,
              deadline?: Date, 
              parentProjectUuid?: UUID,
              uuid?: UUID) 
  {
    this.title = title ? title : "";
    this.description = description ? description : "";
    this.priority = priority ? priority : defaultPriority;

    if (deadline) this.deadline = deadline;
    if (parentProjectUuid) this.parentProjectUuid = parentProjectUuid;

    this.uuid = uuid ? uuid : crypto.randomUUID();
  }
}

export class Project implements DutyPrototype {
  readonly type = "project";
  title: string;
  description: string;
  priority: Priority;
  childTasksUuid: UUID[];
  deadline?: Date;
  readonly uuid: UUID;

  constructor(childTasksUuid: UUID[],
              title?: string,  
              description?: string, 
              priority?: Priority, 
              deadline?: Date, 
              uuid?: UUID) 
  {              
    this.childTasksUuid = childTasksUuid;
    this.title = title ? title : "";
    this.description = description ? description : "";
    this.priority = priority ? priority : defaultPriority;

    if (deadline) this.deadline = deadline;

    this.uuid = uuid ? uuid : crypto.randomUUID();
  }
}

type Operations = "insert" | "append"

export function generateDOMWriteable<T extends Task | Project>(HTMLComponent: string) {
  return (object: T, operation: Operations) => {
    const targetParent = object.type === "task" ? 
      document.querySelector<HTMLDivElement>("div#todo ul.container") :
      document.querySelector<HTMLDivElement>("div#projects ul.container")

    const sanitizeHTML = (): string => {
      let sanitized = HTMLComponent;

      Object.entries(object).forEach((entry: [string, any]) => {
        let [ key, value ] = entry;

        const HTMLLikeSyntax = /<|>/g

        const replaceWith: Record<string, string> = { 
          "<": "&lt;",
          ">": "&gt;"
        };

        value = value.replace(HTMLLikeSyntax, (match: string) => { return replaceWith[match] });

        const propertyAccessOperation = RegExp(`{obj.${key}}`, "g");

        sanitized = sanitized.replace(propertyAccessOperation, value);
      })

      return sanitized;
    }

    if (operation === "insert") {
      targetParent!.innerHTML = `${sanitizeHTML()}${targetParent!.innerHTML}`
      return;
    }

    targetParent!.innerHTML += sanitizeHTML(); 

    /*#####   OLD APPROACH   #####*
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
    *####      ####*/
  };
}