//import "./tasks.css"

import { generateDOMWriteable } from "../../utils/dom-manipulation";
import type { Task } from "../../utils/entities";
import NewTaskFormComponent from "./new-task.html";
import TaskComponent from "./tasks.html";

export const writeTask = generateDOMWriteable<Task>(TaskComponent);

export const writeNewTaskForm =
	generateDOMWriteable<Task>(NewTaskFormComponent);
