import type {
	DutyType,
	generateDOMWriteable,
	Project,
	SelectionState,
	Task,
	UUID,
} from "./utils";

export function handleInsertion(
	e: Event,
	type: DutyType,
	writeToDOM: ReturnType<typeof generateDOMWriteable>,
) {
	const ev = e as MouseEvent;
	//const test = type === "task" ? new Task() : new Project([]);

	//writeToDOM(test, "insert", document.querySelector<HTMLDivElement>("div#todo ul.container"));
}

export function handleItemSelection(
	e: MouseEvent,
	type: DutyType,
	selectionState: SelectionState,
	getDuty: (uuid: UUID, type: DutyType) => Task | Project | undefined,
) {
	let target = e.target as HTMLElement;
	let targetUUID: UUID | null = null;

	const targetIsLI: boolean = !!target.getAttribute("uuid");
	const targetIsChildOfLI: boolean = !!target.matches(`div.${type}`);
	const isTaskCheckbox = !!target.matches("div.task div.checkbox label");
	const isTaskInputCheckbox = !!target.matches("div.task div.checkbox input");

	if (targetIsLI) targetUUID = target.getAttribute("uuid") as UUID;

	if (targetIsChildOfLI) {
		const parent = target.parentElement as HTMLElement;
		targetUUID = parent.getAttribute("uuid") as UUID;
		target = parent;
	}

	if (isTaskCheckbox) {
		const parent = target.parentElement?.parentElement
			?.parentElement as HTMLElement;
		targetUUID = parent.getAttribute("uuid") as UUID;
		target = parent;

		const taskWasChecked = !!(
			(e.target as HTMLElement).parentElement?.getAttribute("completed") !==
			"null"
		);
		const completedOn = !taskWasChecked ? new Date() : null;

		(e.target as HTMLElement).parentElement?.setAttribute(
			"completed",
			String(completedOn),
		);

		const task = getDuty(targetUUID, "task") as Task;
		task.completed = completedOn;
	}

	if (isTaskInputCheckbox) return;

	const divIdContext = type === "task" ? "todo" : "projects";

	if (!targetUUID) {
		const selectedElements = document.querySelectorAll<HTMLElement>(
			`div#${divIdContext} ul.container li`,
		);

		selectedElements.forEach((el) => {
			el.removeAttribute("class");
		});

		selectionState.origin = null;
		selectionState.selected.clear();

		return;
	}

	if (selectionState.origin !== targetUUID) {
		if (!e.ctrlKey && !e.shiftKey) {
			selectionState.selected.forEach((uuid) => {
				const previousSelected = document.querySelector(
					`div#${divIdContext} ul.container li[uuid="${uuid}"]`,
				);
				previousSelected?.removeAttribute("class");
			});
			selectionState.selected.clear();

			if (selectionState.origin) {
				const previousOrigin = document.querySelector(
					`div#${divIdContext} ul.container li.origin-selection`,
				);
				previousOrigin?.removeAttribute("class");
			}

			(selectionState.origin = targetUUID),
				selectionState.selected.add(targetUUID);

			target.classList.add("selected");
			target.classList.add("origin-selection");

			return;
		}

		if (e.ctrlKey && !e.shiftKey) {
			const previousOrigin = document.querySelector(
				`div#${divIdContext} ul.container li[uuid="${selectionState.origin}"]`,
			);

			if (previousOrigin?.classList.contains("selected")) {
				previousOrigin?.classList.remove("origin-selection");
			} else {
				previousOrigin?.removeAttribute("class");
			}

			selectionState.origin = targetUUID;
			target.classList.add("origin-selection");

			if (selectionState.selected.has(targetUUID)) {
				selectionState.selected.delete(targetUUID);

				target.classList.remove("selected");

				return;
			}

			selectionState.selected.add(targetUUID);

			target.classList.add("selected");

			return;
		}
	}

	if (selectionState.origin === targetUUID) {
		if (!e.ctrlKey && !e.shiftKey) {
			if (selectionState.selected.size !== 0) {
				selectionState.selected.forEach((uuid) => {
					const previousSelected = document.querySelector(
						`div#${divIdContext} ul.container li[uuid="${uuid}"]`,
					);
					if (uuid !== targetUUID) previousSelected?.removeAttribute("class");
				});
				selectionState.selected.clear();
			}

			target.classList.toggle("selected");

			return;
		}

		if (e.ctrlKey && !e.shiftKey) {
			if (selectionState.selected.has(targetUUID)) {
				selectionState.selected.delete(targetUUID);

				target.classList.remove("selected");

				return;
			}

			selectionState.selected.add(targetUUID);

			target.classList.add("selected");

			return;
		}
	}
}
