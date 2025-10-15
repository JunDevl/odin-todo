import boilerplateNotes from "../../resources/boilerplate-notes.json";
import boilerplateProjects from "../../resources/boilerplate-projects.json";
import boilerplateTasks from "../../resources/boilerplate-tasks.json";
import { State } from "../main";
import type { DutyPrototype, DutyType, Priority, UUID } from "./types";

export class Task implements DutyPrototype {
	readonly uuid: UUID;
	readonly type = "task";
	title: string;
	description: string;
	priority: Priority;
	deadline: Date | null;
	completed: Date | number | null;
	childTasks: Task[] | UUID[];
	notes: Note[] | UUID[];
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
		this.notes = notes ? notes : [];

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
	childTasks: Task[] | UUID[];
	notes: Note[] | UUID[];

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

		this.childTasks = childTasks ? childTasks : [];
		this.title = title ? title : "";

		this.deadline = deadline
			? typeof deadline === "number"
				? new Date(deadline * 1000)
				: new Date(deadline)
			: null;
		this.description = description ? description : "";

		this.priority = priority ? priority : State.defaultDutyPriority;
		this.notes = notes ? notes : [];

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

	readonly updateRelatedInstances = (() => {
		let called = false;
		return <T extends Note | Task>(
			ref: Task | Project,
			targetUuid: UUID[] | UUID | null,
		) => {
			if (called)
				throw new Error(
					"The function that updates entities relations within javascript can only be called once.",
				);

			called = true;

			if (!Array.isArray(targetUuid) || targetUuid.length === 0) return [];

			const childInstances = targetUuid.map((targetUuid) =>
				State[`${ref.type}s`].get(targetUuid),
			);

			childInstances.forEach((childInstance) => {
				if (childInstance.parent === ref) return;

				childInstance.parent = ref;
			});

			return childInstances;
		};
	})();

	#deserialize(duties: DutyPrototype[] | null, type: DutyType) {
		const iterate = (
			validDuty: DutyPrototype[],
			Duty: { new (proto: DutyPrototype): DutyPrototype },
		): void => {
			for (const duty of validDuty) {
				if (!this.has(duty.uuid)) continue;

				const serialized = new Duty(duty);

				this.#data[serialized.uuid] = serialized as V;
			}
		};

		switch (type) {
			case "task": {
				if (!duties) duties = boilerplateTasks as DutyPrototype[];
				iterate(duties, Task);
				break;
			}

			case "note": {
				if (!duties) duties = boilerplateNotes as DutyPrototype[];
				iterate(duties, Note);
				break;
			}

			case "project": {
				if (!duties) duties = boilerplateProjects as DutyPrototype[];
				iterate(duties, Project);
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
