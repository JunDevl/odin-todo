import boilerplateNotes from "../../resources/boilerplate-notes.json";
import boilerplateProjects from "../../resources/boilerplate-projects.json";
import boilerplateTasks from "../../resources/boilerplate-tasks.json";
import { State } from "../main";
import type {
	AppState,
	DutyPrototype,
	DutyType,
	Priority,
	UUID,
} from "./types";

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
export class EntitiesMap<V extends DutyPrototype> extends Map<UUID, V> {
	#mappedChildRelationship: {
		[key: UUID]: {
			notes: UUID[];
			tasks: UUID[];
		};
	} = {};

	#type: DutyType;

	constructor(type: DutyType) {
		const stored = JSON.parse(localStorage.getItem(type) as string);

		super();

		this.#type = type;
		this.#deserialize(stored);
	}

	readonly updateRelatedInstances = (() => {
		let called = false;
		return (currentState: AppState) => {
			if (called)
				throw new Error(
					"The function that updates entities relationships within javascript can only be called once.",
				);

			called = true;

			Object.entries(this.#mappedChildRelationship).forEach((parent) => {
				if (parent instanceof Note)
					throw new Error("A note can't have child notes/tasks.");
				const [uuid, children] = parent;
				const parentInstance = currentState[`${this.#type}s`].get(
					uuid as UUID,
				) as V;

				if (children.notes.length !== 0) {
					parentInstance.notes = [];
					children.notes.forEach((relatedNoteUuid) => {
						const relatedNoteInstance = currentState.notes.get(
							relatedNoteUuid,
						) as Note;
						(parentInstance.notes as Note[]).push(relatedNoteInstance);
						(relatedNoteInstance.parent as DutyPrototype) = parentInstance;
					});
				}

				if (children.tasks.length !== 0) {
					parentInstance.childTasks = [];
					children.tasks.forEach((relatedTasksUuid) => {
						const relatedTaskInstance = currentState.tasks.get(
							relatedTasksUuid,
						) as Task;
						(parentInstance.childTasks as Task[]).push(relatedTaskInstance);
						(relatedTaskInstance.parent as DutyPrototype) = parentInstance;
					});
				}
			});
		};
	})();

	#deserialize(duties: DutyPrototype[] | null) {
		const iterate = (
			validDuty: DutyPrototype[],
			Duty: { new (proto: DutyPrototype): DutyPrototype },
		): void => {
			for (const duty of validDuty) {
				if (this.has(duty.uuid)) continue;

				const serialized = new Duty(duty);

				if (
					(serialized instanceof Task || serialized instanceof Project) &&
					(serialized.childTasks.length !== 0 || serialized.notes.length !== 0)
				) {
					this.#mappedChildRelationship[serialized.uuid] = {
						notes: serialized.notes as UUID[],
						tasks: serialized.childTasks as UUID[],
					};
				}

				this.set(serialized.uuid, serialized as V);
			}
		};

		switch (this.#type) {
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

	set(key: UUID, value: V): this {
		super.set(key, value);

		const makeStorageable = () => {
			const storageable: Record<string, any> = {};

			Object.entries(value).forEach((item) => {
				const key = item[0];
				let val = item[1];

				if (Array.isArray(val) && val.length > 0 && val[0].uuid)
					val.map((child) => child.uuid);

				if (val instanceof Date) val = Number(val) / 1000;

				if (key === "parent" && val) val = val.uuid;

				storageable[key] = val;
			});

			return JSON.stringify(storageable);
		};

		localStorage.setItem(key, makeStorageable());

		return this;
	}

	delete(key: UUID): boolean {
		if (!this.has(key)) return false;

		localStorage.removeItem(key);
		super.delete(key);

		return true;
	}

	clear(): void {
		super.clear();
		Object.keys(this).forEach((key) => {
			localStorage.removeItem(key);
		});
	}
}
