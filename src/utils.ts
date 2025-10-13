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
	insertionEvHandler: (e: MouseEvent) => void;
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

	constructor(prototype?: DutyPrototype) {
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
		} = prototype ? prototype : {};

		let relatedNotes: Note[] = [];

		if (prototype) {
			relatedNotes =
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
		}

		this.title = title ? title : "";
		this.description = description ? description : "";
		this.priority = priority ? priority : defaultPriority;
		this.deadline = deadline
			? new Date(((<unknown>deadline) as number) * 1000)
			: null;
		this.parent = parent ? parent : null;
		this.childTasks = childTasks ? childTasks : [];
		this.notes = relatedNotes;

		if (childTasks?.length === 0)
			this.completed = completed
				? new Date(((<unknown>completed) as number) * 1000)
				: null;
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

	constructor(prototype?: DutyPrototype) {
		const {
			childTasks,
			title,
			description,
			priority,
			deadline,
			notes,
			uuid,
			completed,
		} = prototype ? prototype : {};

		let relatedChildTasks: Task[] = [];
		let relatedNotes: Note[] = [];

		if (prototype) {
			relatedChildTasks =
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

			relatedNotes =
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
		}

		this.childTasks = relatedChildTasks;
		this.title = title ? title : "";
		this.description = description ? description : "";
		this.priority = priority ? priority : defaultPriority;
		this.notes = relatedNotes;

		this.completed = completed ? (completed as number) : 0;
		this.deadline = deadline
			? new Date(((<unknown>deadline) as number) * 1000)
			: null;

		this.uuid = uuid ? uuid : crypto.randomUUID();
	}
}

export class Note implements DutyPrototype {
	readonly uuid: UUID;
	readonly type = "note";
	title: string;
	description: string;
	parent: UUID | Task | Project | null;

	constructor(prototype?: DutyPrototype) {
		const { title, description, parent, uuid } = prototype ? prototype : {};

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

				const replaceWith: Record<string, string> = {
					"<": "&lt;",
					">": "&gt;",
				};

				const propertyAccessOperation: RegExp = RegExp(`{obj.${key}}`, "g");

				if (!value) {
					sanitized = sanitized.replace(propertyAccessOperation, "Not defined");
					return;
				}

				let formattedValue: string;

				const HTMLLikeSyntax: RegExp = /<|>/g;

				const valueIsDate = value instanceof Date;

				if (valueIsDate) {
					const userLang = navigator.language || document.documentElement.lang;
					formattedValue = new Intl.DateTimeFormat(userLang).format(value);
				} else {
					formattedValue = String(value).replace(
						HTMLLikeSyntax,
						(match: string) => {
							return replaceWith[match];
						},
					);
				}

				sanitized = sanitized.replace(propertyAccessOperation, formattedValue);
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
