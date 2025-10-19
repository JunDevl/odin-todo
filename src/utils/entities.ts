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
	itemsWithChildren: Map<UUID, V> = new Map<UUID, V>();

	#type: DutyType;

	static #stored: Record<string, DutyPrototype[]> = (() => {
		const result: Record<string, DutyPrototype[]> = {};
		if (localStorage.length > 0) {
			Object.values(localStorage).forEach((storedObj) => {
				const parsed = JSON.parse(storedObj);

				const wasTypeDefined = !!result[`${parsed.type}s`];
				if (!wasTypeDefined) result[`${parsed.type}s`] = [];
				result[`${parsed.type}s`].push(parsed);
			});
		}
		return result ? result : {};
	})();

	constructor(type: DutyType) {
		super();

		this.#type = type;

		this.#deserialize();
	}

	readonly updateRelatedInstances = (() => {
		let called = false;
		return (currentState: AppState) => {
			if (called)
				throw new Error(
					"The function that updates entities relationships within javascript can only be called once.",
				);

			called = true;

			this.itemsWithChildren.forEach((parent) => {
				if (parent instanceof Note)
					throw new Error("A note can't have child notes/tasks.");

				if (parent.notes && parent.notes.length !== 0) {
					parent.notes = parent.notes.map((relatedNoteUuid) => {
						const relatedNoteInstance = currentState.notes.get(
							relatedNoteUuid as UUID,
						) as Note;
						(relatedNoteInstance.parent as DutyPrototype) = parent;
						return relatedNoteInstance;
					});
				}

				if (parent.childTasks && parent.childTasks.length !== 0) {
					parent.childTasks = parent.childTasks.map((relatedTasksUuid) => {
						const relatedTaskInstance = currentState.tasks.get(
							relatedTasksUuid as UUID,
						) as Task;
						(relatedTaskInstance.parent as DutyPrototype) = parent;
						return relatedTaskInstance;
					});
				}
			});
		};
	})();

	#deserialize() {
		const iterate = (
			validDuty: DutyPrototype[],
			Duty: { new (proto: DutyPrototype): DutyPrototype },
		): void => {
			for (const duty of validDuty) {
				if (this.has(duty.uuid)) continue;

				const deserialized = new Duty(duty);

				if (
					(deserialized instanceof Task || deserialized instanceof Project) &&
					(deserialized.childTasks.length !== 0 ||
						deserialized.notes.length !== 0)
				) {
					this.itemsWithChildren.set(deserialized.uuid, deserialized as V);
				}

				this.set(deserialized.uuid, deserialized as V);
			}
		};

		let duties: DutyPrototype[] | null =
			localStorage.length > 0 ? EntitiesMap.#stored[`${this.#type}s`] : null;

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

	#makeStorageable = (value: DutyPrototype) => {
		const storageable: Record<string, any> = {};

		Object.entries(value).forEach((item) => {
			const key = item[0];
			let val = item[1];

			if (Array.isArray(val) && val.length > 0 && val[0].uuid)
				val = val.map((child) => child.uuid);

			if (val instanceof Date) val = Number(val) / 1000;

			if (key === "parent" && val) val = val.uuid;

			storageable[key] = val;
		});

		return JSON.stringify(storageable);
	};

	set(key: UUID, value: V): this {
		localStorage.setItem(key, this.#makeStorageable(value));
		super.set(key, value);

		return this;
	}

	delete(key: UUID): boolean {
		if (!this.has(key)) return false;

		localStorage.removeItem(key);

		const thisInstance = this.get(key);

		if (
			Array.isArray(thisInstance?.childTasks) &&
			thisInstance.childTasks.length > 0
		)
			thisInstance.childTasks.forEach((childTask) => {
				(childTask as Task).parent = null;

				if (this.itemsWithChildren.has(key)) this.itemsWithChildren.delete(key);
			});

		if (Array.isArray(thisInstance?.notes) && thisInstance.notes.length > 0)
			thisInstance.notes.forEach((note) => {
				(note as Note).parent = null;

				if (this.itemsWithChildren.has(key)) this.itemsWithChildren.delete(key);
			});

		if (thisInstance?.parent && thisInstance instanceof Note) {
			const notesOfParent = (thisInstance.parent as V).notes as Note[];
			notesOfParent.splice(
				notesOfParent.findIndex(
					(note) => (note as Note).uuid === key,
				) as number,
				1,
			);
			localStorage.setItem(
				(thisInstance.parent as V).uuid,
				this.#makeStorageable(thisInstance.parent as V),
			);
		}

		if (thisInstance?.parent && thisInstance instanceof Task) {
			const tasksOfParent = (thisInstance.parent as V).childTasks as Task[];
			tasksOfParent.splice(
				tasksOfParent.findIndex(
					(task) => (task as Task).uuid === key,
				) as number,
				1,
			);
			localStorage.setItem(
				(thisInstance.parent as V).uuid,
				this.#makeStorageable(thisInstance.parent as V),
			);
		}

		super.delete(key);

		return true;
	}

	clear(): void {
		super.clear();
		localStorage.clear();
	}
}
