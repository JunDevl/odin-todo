import { State } from "./main";

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

	page: Page;

	observer: IntersectionObserver | null;

	selection: SelectionState;
	itemSelectionEvHandler: (e: MouseEvent) => void;
}

export interface DutyPrototype {
	readonly type: DutyType;
	readonly uuid: UUID;
	title: string; // TO-DO: implement this
	description: string;
	priority: Priority; // TO-DO: implement this
	deadline: Date | null;
	completed: Date | number | null;

	parentProject?: UUID | Project | null; // Exclusively implemented by Tasks class
	childTasks?: Task[]; // Excluively implemented by Projects class
}

export class Task implements DutyPrototype {
	readonly type = "task";
	readonly uuid: UUID;
	title: string;
	description: string;
	priority: Priority;
	deadline: Date | null;
	parentProject: UUID | Project | null;
	completed: Date | null;

	constructor(prototype: DutyPrototype) {
		const {
			title,
			description,
			priority,
			deadline,
			parentProject,
			uuid,
			completed,
		} = prototype;

		this.title = title ? title : "";
		this.description = description ? description : "";
		this.priority = priority ? priority : defaultPriority;
		this.deadline = deadline ? deadline : null;
		this.parentProject = parentProject ? parentProject : null;

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
	childTasks: Task[];
	deadline: Date | null;
	readonly uuid: UUID;

	constructor(prototype: DutyPrototype) {
		const {
			childTasks,
			title,
			description,
			priority,
			deadline,
			uuid,
			completed,
		} = prototype;

		const tasks =
			childTasks?.length !== 0
				? ((<unknown>childTasks) as UUID[]).map((taskUUID) => {
						return State.storedTasks.get(taskUUID) as Task;
					})
				: [];

		if (tasks.length !== 0) {
			tasks.forEach((task) => {
				task.parentProject = this;
			});
		}

		this.childTasks = tasks;
		this.title = title ? title : "";
		this.description = description ? description : "";
		this.priority = priority ? priority : defaultPriority;

		this.completed = completed ? (completed as number) : 0;
		this.deadline = deadline ? new Date(deadline) : null;

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
