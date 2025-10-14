import { writeNewTaskFormToDOM, writeTaskToDOM } from "./components/tasks";
import { State } from "./main";
import type { DutyPrototype, DutyType, SelectionState, UUID } from "./utils";
import { Note, Project, Task } from "./utils";

export function handleInsertion(e: MouseEvent, type: DutyType) {
	const addButton = e.currentTarget as HTMLElement;

	let container: HTMLElement;
	let form: HTMLFormElement;

	addButton.removeEventListener("click", State.insertionEvHandler, {
		capture: true,
	});

	function resetEventListeners() {
		addButton.removeEventListener("click", handleButtonClicked, {
			capture: true,
		});
		addButton.addEventListener("click", State.insertionEvHandler, {
			capture: true,
		});
		document.body.removeEventListener("keypress", handleKeyPressed);
	}

	function updateDuty<D extends DutyPrototype>(
		e: SubmitEvent,
		d: { new (proto: DutyPrototype): D },
	) {
		e.preventDefault();
		const newPrototype = (<unknown>(
			Object.fromEntries(new FormData(form).entries())
		)) as DutyPrototype;

		const instance = new d(newPrototype);

		State[`${type}s`].set(instance.uuid, instance as never);

		container.removeChild(form.parentElement as HTMLElement);

		writeTaskToDOM("insert", container, instance as Task);

		resetEventListeners();
	}

	function handleKeyPressed(e: KeyboardEvent) {
		if (e.key === "Enter") {
			form.dispatchEvent(new Event("submit"));
			resetEventListeners();
			return;
		}
	}

	function handleButtonClicked(e: MouseEvent) {
		form.dispatchEvent(new Event("submit"));
		resetEventListeners();
	}

	switch (type) {
		case "task": {
			container = document.querySelector(
				"div#todo ul.container",
			) as HTMLElement;

			writeNewTaskFormToDOM("insert", container);

			form = document.querySelector("form#new-task") as HTMLFormElement;

			form.addEventListener("submit", (e) => updateDuty(e, Task));

			break;
		}

		case "project": {
			break;
		}

		case "note": {
			break;
		}
	}

	document.body.addEventListener("keypress", handleKeyPressed);

	addButton.addEventListener("click", handleButtonClicked, {
		capture: true,
	});
}

export function handleClick(
	e: MouseEvent,
	type: DutyType,
	selectionState: SelectionState,
) {
	let target = e.target as HTMLElement;
	let child: HTMLElement | null = null;
	let parent: HTMLElement | null = null;
	let targetUUID: UUID | null = null;

	const divIdContext = type === "task" ? "todo" : "projects";

	const targetIsLI: boolean = target.hasAttribute("uuid");
	if (targetIsLI) targetUUID = target.getAttribute("uuid") as UUID;

	const targetIsChildOfLI: boolean = target.matches(`ul.container li *`);
	const isTaskCheckbox = target.matches("div.task div.checkbox label");
	if (targetIsChildOfLI && !isTaskCheckbox) {
		parent = target.closest("ul.container li") as HTMLElement;
		targetUUID = parent.getAttribute("uuid") as UUID;
		child = target;
		target = parent;

		const targetIsButtonOption = child.matches("div.options button");
		if (targetIsButtonOption) handleItemOptions();
	}

	if (isTaskCheckbox) {
		const parent = document.querySelector(
			`li[uuid="${target.getAttribute("for")}"]`,
		) as HTMLElement;
		targetUUID = parent.getAttribute("uuid") as UUID;
		target = parent;

		const task = State.tasks.get(targetUUID) as Task;
		const taskWasChecked = task.completed;
		const completed = !taskWasChecked ? new Date() : null;
		task.completed = completed;
	}

	handleItemSelection();

	return;

	function handleItemSelection() {
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

				selectionState.origin = targetUUID;
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

	function handleItemOptions() {
		const uuid = targetUUID as UUID;
		const container = document.querySelector(
			`div#${divIdContext} ul.container`,
		) as HTMLUListElement;
		switch ((child as HTMLButtonElement).getAttribute("class")) {
			case "expand":
				break;

			case "delete":
				State[`${type}s`].delete(uuid);
				container.removeChild(parent as HTMLElement);
				break;
		}
	}
}
