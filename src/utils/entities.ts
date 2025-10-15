import boilerplateNotes from "../../resources/boilerplate-notes.json";
import boilerplateProjects from "../../resources/boilerplate-projects.json";
import boilerplateTasks from "../../resources/boilerplate-tasks.json";
import { State } from "../main";
import type { DutyPrototype, DutyType, Priority, UUID } from "./types";

function getRelatedInstances<T extends Note | Task>(
	ref: Task | Project,
	uuid: UUID[] | UUID | null,
): T[] {
	if (!Array.isArray(uuid) || uuid.length === 0) return [];

	const childInstances = uuid.map((uuid) => State[`${ref.type}s`].get(uuid));

	childInstances.forEach((childInstance) => {
		if (childInstance.parent === ref) return;

		childInstance.parent = ref;
	});

	return childInstances;
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

		if (prototype && prototype.notes?.length !== 0)
			relatedNotes = getRelatedInstances<Note>(this, notes as UUID[]);

		this.title = title ? title : "";
		this.description = description ? description : "";
		this.priority = priority ? priority : State.defaultDutyPriority;

		this.deadline = deadline
			? typeof deadline === "number"
				? new Date(deadline * 1000)
				: new Date(deadline)
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

		let relatedTasks: Task[] = [];
		let relatedNotes: Note[] = [];

		if (prototype && childTasks?.length !== 0)
			relatedTasks = getRelatedInstances<Task>(this, childTasks as UUID[]);

		if (prototype && notes?.length !== 0)
			relatedNotes = getRelatedInstances<Note>(this, notes as UUID[]);

		this.childTasks = relatedTasks;
		this.title = title ? title : "";

		this.deadline = deadline
			? typeof deadline === "number"
				? new Date(deadline * 1000)
				: new Date(deadline)
			: null;
		this.description = description ? description : "";

		this.priority = priority ? priority : State.defaultDutyPriority;
		this.notes = relatedNotes;

		this.completed = completed ? (completed as number) : 0;

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

export class EntitiesMap<V extends DutyPrototype> extends Map {
	#data: {
		[key: UUID]: V;
	} = {};

	constructor(type: DutyType) {
		super();

		const stored = localStorage.getItem(type);

		this.#deserialize(stored ? JSON.parse(stored) : null, type);
	}

	#deserialize(object: DutyPrototype[] | null, type: DutyType) {
		const iterate = <T extends V>(
			validObj: DutyPrototype[],
			Duty: { new (proto: DutyPrototype): DutyPrototype },
		): void => {
			for (const props of validObj) {
				const serialized = new Duty(props);
				this.#data[serialized.uuid] = serialized as T;
			}
		};

		switch (type) {
			case "task": {
				if (!object) object = boilerplateTasks as DutyPrototype[];
				iterate(object, Task);
				break;
			}

			case "note": {
				if (!object) object = boilerplateNotes as DutyPrototype[];
				iterate(object, Note);
				break;
			}

			case "project": {
				if (!object) object = boilerplateProjects as DutyPrototype[];
				iterate(object, Project);
				break;
			}
		}
	}

	override set(key: UUID, value: V): this {
		this.#data[key] = value;
		localStorage.setItem(`${value.type}s`, JSON.stringify(value));

		return this;
	}

	override delete(key: UUID): boolean {
		if (!this.#data[key]) return false;

		localStorage.removeItem(`${this.#data[key].type}s`);
		delete this.#data[key];

		return true;
	}

	override clear(): void {
		this.#data = {};
		localStorage.clear();
	}
}
