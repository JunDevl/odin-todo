export type Prettify<T> = {
  [k in keyof T]: T[k]
} & {}

export type UUID = ReturnType<typeof crypto.randomUUID>

export type Priority = "low" | "medium" | "high";

export type DutyType = "task" | "project"

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