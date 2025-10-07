import Global from "./main";

export type Prettify<T> = {
	[k in keyof T]: T[k];
} & {};

export type UUID = ReturnType<typeof crypto.randomUUID>;

export type Priority = "low" | "medium" | "high";

export type DutyType = "task" | "project";

export enum Page {
	Tasks,
	Projects,
	Tracker,
	Configurations,
}

const defaultPriority: Priority = "medium";

export type SelectionState = {
	origin: UUID | null;
	selected: Set<UUID>;
};

export interface DutyPrototype {
	readonly type: DutyType;
	readonly uuid: UUID;
  completed: boolean | number;
	title?: string; // TO-DO: implement this
	description?: string;
	priority?: Priority; // TO-DO: implement this
	deadline?: Date;

	parentProjectUuid?: UUID; // Exclusively implemented by Tasks class
	childTasksUuid?: UUID[]; // Excluively implemented by Projects class
}

export class Task implements DutyPrototype {
	readonly type = "task";
  completed: boolean;
	title: string;
	description: string;
	priority: Priority;
	deadline?: Date;
	parentProjectUuid?: UUID;
	readonly uuid: UUID;

	constructor(
		title?: string,
		description?: string,
		priority?: Priority,
		deadline?: Date,
		parentProjectUuid?: UUID,
    completed?: boolean,
		uuid?: UUID,
	) {
		this.title = title ? title : "";
		this.description = description ? description : "";
		this.priority = priority ? priority : defaultPriority;

		if (deadline) this.deadline = deadline;
		if (parentProjectUuid) this.parentProjectUuid = parentProjectUuid;

    this.completed = completed ? completed : false;
		this.uuid = uuid ? uuid : crypto.randomUUID();
	}
}

export class Project implements DutyPrototype {
	readonly type = "project";
  completed: number;
	title: string;
	description: string;
	priority: Priority;
	childTasksUuid: UUID[];
	deadline?: Date;
	readonly uuid: UUID;

	constructor(
		childTasksUuid?: UUID[],
		title?: string,
		description?: string,
		priority?: Priority,
		deadline?: Date,
		completed?: number,
		uuid?: UUID,
	) {
		this.childTasksUuid = childTasksUuid ? childTasksUuid : [];
		this.title = title ? title : "";
		this.description = description ? description : "";
		this.priority = priority ? priority : defaultPriority;
    this.completed = completed ? completed : 0;

		if (deadline) this.deadline = deadline;

		this.uuid = uuid ? uuid : crypto.randomUUID();
	}
}

type Operations = "insert" | "append";

export function generateDOMWriteable<T extends Task | Project>(
	HTMLComponent: string,
) {
	return (object: T, operation: Operations, targetParent: HTMLElement | null) => {
		if (!targetParent)
			throw new Error("Target element must be a valid HTML element container.");

		const sanitizeHTML = (): string => {
			let sanitized = HTMLComponent;

			Object.entries(object).forEach((entry) => {
				const [key, value] = entry;

				const HTMLLikeSyntax = /<|>/g;

				const replaceWith: Record<string, string> = {
					"<": "&lt;",
					">": "&gt;",
				};

				const HTMLRemoved = String(value).replace(
					HTMLLikeSyntax,
					(match: string) => {
						return replaceWith[match];
					},
				);

				const propertyAccessOperation = RegExp(`{obj.${key}}`, "g");

				sanitized = sanitized.replace(propertyAccessOperation, HTMLRemoved);
			});

			return sanitized;
		};

		if (operation === "insert") {
			targetParent.innerHTML = `${sanitizeHTML()}${targetParent.innerHTML}`;
			return;
		}

		targetParent.innerHTML += sanitizeHTML();
	};
}
