import { State } from "./main";

export type Prettify<T> = {
	[k in keyof T]: T[k];
} & {};

export type UUID = ReturnType<typeof crypto.randomUUID>;

export type Priority = "low" | "medium" | "high" | "very high";

export type DutyType = "task" | "project" | "note";

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
	tasks: Map<UUID, Task>;
	projects: Map<UUID, Project>;
	notes: Map<UUID, Note>;

	page: Page;

	observer: IntersectionObserver | null;

	selection: SelectionState;
	itemSelectionEvHandler: (e: MouseEvent) => void;
}

export interface DutyPrototype {
	readonly uuid: UUID;
	readonly type: DutyType;
	title: string; // TO-DO: implement this
	description: string;

	priority?: Priority; // TO-DO: implement this
	deadline?: Date | null;
	completed?: Date | number | null;

	childTasks?: UUID[] | Task[];
	notes?: UUID[] | Note[];
	parent?: UUID | Project | Task | null; // Exclusively implemented by Tasks class
}

export class Task implements DutyPrototype {
	readonly uuid: UUID;
	readonly type = "task";
	title: string;
	description: string;
	priority: Priority;
	deadline: Date | null;
	completed: Date | number | null;
	childTasks: UUID[] | Task[];
	notes: Note[];
	parent: UUID | Project | Task | null;

	constructor(prototype: DutyPrototype) {
		const {
			title,
			description,
			priority,
			deadline,
			childTasks,
			notes,
			parent,
			completed,
			uuid,
		} = prototype;

		const relatedNotes =
			notes?.length !== 0
				? ((<unknown>notes) as UUID[]).map((noteUUID) => {
						return State.notes.get(noteUUID) as Note;
					})
				: [];

		if (relatedNotes.length !== 0) {
			relatedNotes.forEach((note) => {
				note.parent = this;
			});
		}

		this.title = title ? title : "";
		this.description = description ? description : "";
		this.priority = priority ? priority : defaultPriority;
		this.deadline = deadline ? deadline : null;
		this.parent = parent ? parent : null;
		this.childTasks = childTasks ? childTasks : [];
		this.notes = relatedNotes;

		if (childTasks?.length === 0)
			this.completed = completed ? new Date(completed) : null;
		else this.completed = completed ? completed : 0;

		this.uuid = uuid ? uuid : crypto.randomUUID();
	}
}

export class Project implements DutyPrototype {
	readonly uuid: UUID;
	readonly type = "project";
	title: string;
	description: string;
	priority: Priority;
	deadline: Date | null;
	completed: number;
	childTasks: Task[];
	notes: Note[];

	constructor(prototype: DutyPrototype) {
		const {
			childTasks,
			title,
			description,
			priority,
			deadline,
			notes,
			uuid,
			completed,
		} = prototype;

		const relatedChildTasks =
			childTasks?.length !== 0
				? ((<unknown>childTasks) as UUID[]).map((taskUUID) => {
						return State.tasks.get(taskUUID) as Task;
					})
				: [];

		if (relatedChildTasks.length !== 0) {
			relatedChildTasks.forEach((task) => {
				task.parent = this;
			});
		}

		const relatedNotes =
			notes?.length !== 0
				? ((<unknown>notes) as UUID[]).map((noteUUID) => {
						return State.notes.get(noteUUID) as Note;
					})
				: [];

		if (relatedNotes.length !== 0) {
			relatedNotes.forEach((note) => {
				note.parent = this;
			});
		}

		this.childTasks = relatedChildTasks;
		this.title = title ? title : "";
		this.description = description ? description : "";
		this.priority = priority ? priority : defaultPriority;
		this.notes = relatedNotes;

		this.completed = completed ? (completed as number) : 0;
		this.deadline = deadline ? new Date(deadline) : null;

		this.uuid = uuid ? uuid : crypto.randomUUID();
	}
}

export class Note implements DutyPrototype {
	readonly uuid: UUID;
	readonly type = "note";
	title: string;
	description: string;
	parent: UUID | Task | Project | null;

	constructor(prototype: DutyPrototype) {
		const { title, description, parent, uuid } = prototype;

		this.title = title ? title : "";
		this.description = description ? description : "";
		this.parent = parent ? parent : null;
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
