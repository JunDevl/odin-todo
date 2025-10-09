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

export interface AppState {
	storedTasks: Map<UUID, Task>;
	storedProjects: Map<UUID, Project>;

	currentSelection: SelectionState;

	currentPage: Page;

	currentObserver: IntersectionObserver | null;

	currentItemSelectionEventHandler: (e: MouseEvent) => void;
}

export interface DutyPrototype {
	readonly type: DutyType;
	readonly uuid: UUID;
	title: string; // TO-DO: implement this
	description: string;
	priority: Priority; // TO-DO: implement this
	deadline: Date | null;
	completed: Date | number | null;

	parentProjectUuid?: UUID | null; // Exclusively implemented by Tasks class
	childTasksUuid?: UUID[]; // Excluively implemented by Projects class
}

export class Task implements DutyPrototype {
	readonly type = "task";
	readonly uuid: UUID;
	title: string;
	description: string;
	priority: Priority;
	deadline: Date | null;
	parentProjectUuid: UUID | null;
	completed: Date | null;

	constructor(prototype: DutyPrototype) {
		const {
			title,
			description,
			priority,
			deadline,
			parentProjectUuid,
			uuid,
			completed,
		} = prototype;

		if (typeof completed === "number") {
			throw new Error("You cannot insantiate a new task object with a number.");
		}

		this.title = title ? title : "";
		this.description = description ? description : "";
		this.priority = priority ? priority : defaultPriority;
		this.deadline = deadline ? deadline : null;
		this.parentProjectUuid = parentProjectUuid ? parentProjectUuid : null;

		this.completed = completed ? new Date(completed) : null;
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
	deadline: Date | null;
	readonly uuid: UUID;

	constructor(prototype: DutyPrototype) {
		const {
			childTasksUuid,
			title,
			description,
			priority,
			deadline,
			uuid,
			completed,
		} = prototype;
		if (completed instanceof Date)
			throw new Error(
				"You cannot insantiate a new task object with a date string.",
			);

		this.childTasksUuid = childTasksUuid ? childTasksUuid : [];
		this.title = title ? title : "";
		this.description = description ? description : "";
		this.priority = priority ? priority : defaultPriority;

		this.completed = completed ? completed : 0;
		this.deadline = deadline ? deadline : null;

		this.uuid = uuid ? uuid : crypto.randomUUID();
	}
}

type Operations = "insert" | "append";

export function generateDOMWriteable<T extends Task | Project>(
	HTMLComponent: string,
) {
	return (
		object: T,
		operation: Operations,
		targetParent: HTMLElement | null,
	) => {
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
			targetParent.insertAdjacentHTML("afterbegin", sanitizeHTML());
			return;
		}

		targetParent.insertAdjacentHTML("beforeend", sanitizeHTML());
	};
}
