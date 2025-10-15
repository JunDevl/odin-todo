import type { EntitiesMap, Note, Project, Task } from "./entities";

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

export type SelectionState = {
	origin: UUID | null;
	selected: Set<UUID>;
};

export interface AppState {
	tasks: EntitiesMap<Task>;
	projects: EntitiesMap<Project>;
	notes: EntitiesMap<Note>;

	page: Page;

	menuObserver: IntersectionObserver | null;

	itemSelection: SelectionState;

	defaultDutyPriority: Priority;

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
