//import "./tasks.css"

import { generateDOMWriteable } from "../../../utils/dom-manipulation";
import type { Task } from "../../../utils/entities";
import FullPageTaskComponent from "./task.html";

const writeFullPageTaskToDOM = generateDOMWriteable<Task>(
	FullPageTaskComponent,
);

export default writeFullPageTaskToDOM;
