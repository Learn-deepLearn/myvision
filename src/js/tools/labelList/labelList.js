import { changeObjectLabelText, changeLabelVisibilityById } from '../../canvas/objects/label/label';
import {
  highlightShapeFill, defaultShapeFill, changeShapeColorById,
  getShapeById, changeShapeVisibilityById, getShapeVisibilityById,
} from '../../canvas/objects/allShapes/allShapes';
import { removePolygonPoints } from '../../canvas/objects/polygon/alterPolygon/alterPolygon';
import {
  setEditingLabelId, setNewShapeSelectedViaLabelListState,
  getDefaultState, getAddingPolygonPointsState,
} from '../toolkit/buttonEvents/facadeWorkersUtils/stateManager';
import {
  polygonMouseDownEvents, polygonMouseUpEvents, getLastSelectedShapeId, removeEditedPolygonId,
  programaticallySelectBoundingBox, programaticallyDeselectBoundingBox, setShapeToInvisible,
} from '../../canvas/mouseInteractions/mouseEvents/eventWorkers/editPolygonEventsWorker';
import {
  setLabelListElementForHighlights, changeLabelColor,
  removeHighlightOfListLabel, highlightLabelInTheList,
} from './highlightLabelList';
import { resetCanvasToDefaultAfterAddPoints } from '../../canvas/mouseInteractions/mouseEvents/resetCanvasUtils/resetCanvasAfterAddPoints';
import {
  addToLabelOptions, sendLabelOptionToFront, getLabelOptions, getLabelColor,
} from './labelOptions';

let isLabelSelected = false;
let isVisibilitySelected = false;
let isVisibilityRestored = false;
let activeDropdownElements = null;
let activeLabelTextElement = null;
let activeLabelId = null;
let deselectedEditing = false;
let labelHasBeenDeselected = false;
let activeShape = null;
let activeLabelElementId = null;
let activeEditLabelButton = null;
let tableElement = null;
let isLabelChanged = false;
let labelOptionsElement = null;
let lastSelectedLabelOption = null;
let availableListOptions = [];

// refactor label popup label options element manipulation code

// consider narrowing down the dropdown to make it more appropriate
// should be able to select labels in add/remove point modes

// get default font style in browser and compute dimensions accordingly
// make sure to consider label name validations
// escape should close the popup - more on hotkeys

function findLabelListElement() {
  tableElement = document.getElementById('tableList');
}

function findPopupElement() {
  labelOptionsElement = document.getElementById('popup-label-options');
}

function initialiseLabelListFunctionality() {
  findLabelListElement();
  findPopupElement();
  setLabelListElementForHighlights(tableElement);
}

// function initialiseNewElement() {
//   return document.createElement('button');
// }
//
// function addLabelToList(labelName) {
//   const labelElement = initialiseNewElement();
//   labelElement.innerHTML = labelName;
//   labelListElement.appendChild(labelElement);
// }

// .labelListObj:hover {
//   background-color: blue;
// }

function createNewDropdown() {
  const labelDropdownOptions = getLabelOptions();
  let dropdown = '<tbody>';
  for (let i = 0; i < labelDropdownOptions.length; i += 1) {
    const dropdownElement = `<tr><td><div id="labelOption${i}" onMouseEnter="hoverLabelOption(this, '${labelDropdownOptions[i].color.label}')" onMouseLeave="labelOptionMouseOut(this)" class="labelDropdownOption">${labelDropdownOptions[i].text}</div></td></tr>\n`;
    dropdown += dropdownElement;
  }
  dropdown += '</tbody>';
  return dropdown;
}

window.hoverLabelOption = (element, color) => {
  element.style.backgroundColor = color;
};

window.labelOptionMouseOut = (element) => {
  if (element.id !== 'used') {
    element.style.backgroundColor = '';
  }
};

function repopulateDropdown() {
  const dropdown = createNewDropdown();
  const dropdownParentElements = document.getElementsByClassName('dropdown-content');
  for (let i = 0; i < dropdownParentElements.length; i += 1) {
    dropdownParentElements[i].innerHTML = dropdown;
  }
}

function createLabelElementMarkup(labelText, id, backgroundColor) {
  return `
  <div id="labelId${id}" onMouseEnter="highlightShapeFill(${id})" onMouseLeave="defaultShapeFill(${id})" onClick="labelBtnClick(${id})" class="label${id} labelListItem" style="background-color: ${backgroundColor}">
    <div id="default" onMouseEnter="mouseEnterOnVisibility(id, this)" onMouseLeave="mouseLeaveOnVisibility(id, this)" onClick="visibilityBtnClick(${id}, this)" style="float:left; user-select: none; padding-right: 5px; width: 12px;">
      <img src="visibility-button.svg" style="width:10px; padding-left: 1px" alt="visibility">
      <img src="visibility-button-highlighted.svg" style="width:12px; display: none; padding-top: 3px" alt="visibility">
      <img src="invisible-button.svg" style="width:10px; display: none; padding-left: 1px" alt="visibility">
      <img src="invisible-button-highlighted.svg" style="width:12px; padding-top: 3px; display: none" alt="visibility">
    </div>
    <div id="editButton${id}" onMouseEnter="mouseEnterOnLabelEdit(this)" onMouseLeave="mouseLeaveOnLabelEdit(this)" onClick="editLabelBtnClick(${id}, this)" style="float:left; user-select: none; padding-right: 5px; width: 11px">
      <img id="editButton${id}" src="edit.svg" style="width:9px; padding-left: 1px" alt="edit">
      <img id="editButton${id}" src="edit-highlighted.svg" style="width:11px; display: none; padding-top: 4px" alt="edit">
      <img id="editButton${id}" src="done-tick.svg" style="width:9px; display: none" alt="edit">
      <img id="editButton${id}" src="done-tick-highlighted.svg" style="width:10px; display: none" alt="edit">
  </div>
    <div id="labelText${id}" onkeydown="labelTextKeyDown(event)" ondblclick="labelDblClicked(${id})" class="labelText" contentEditable="false" onInput="changeObjectLabelText(innerHTML, this, event)" style="user-select: none; padding-right: 29px; border: 1px solid transparent; display: grid;">${labelText}</div>
      <table class="dropdown-content labelDropdown${id}">
      </table>
    </div>
  </div>
  `;
}

// <td>
// <div class="labelDropdownOption">asdasdasdasdas</div>
// <div class="labelDropdownOption">asdasdasdasdasas</div>
// <div class="labelDropdownOption">asasas</div>
// <div class="labelDropdownOption">asasasasasas</div>
// <div class="labelDropdownOption">asdasdasdasdas</div>
// <div class="labelDropdownOption">asdasdasdasdas</div>
// </td>

function highlightDefaultIcon(element) {
  element.childNodes[1].style.display = 'none';
  element.childNodes[3].style.display = '';
}

function dimDefaultIcon(element) {
  element.childNodes[1].style.display = '';
  element.childNodes[3].style.display = 'none';
}

function highlightActiveIcon(element) {
  element.childNodes[5].style.display = 'none';
  element.childNodes[7].style.display = '';
}

function dimActiveIcon(element) {
  element.childNodes[5].style.display = '';
  element.childNodes[7].style.display = 'none';
}

function switchToDefaultIcon() {
  activeEditLabelButton.childNodes[1].style.display = '';
  activeEditLabelButton.childNodes[5].style.display = 'none';
}

function switchToActiveIcon(element) {
  element.childNodes[1].style.display = 'none';
  element.childNodes[5].style.display = '';
}

function switchToHighlightedActiveIcon(element) {
  element.childNodes[3].style.display = 'none';
  element.childNodes[7].style.display = '';
}

function switchToHighlightedDefaultIcon() {
  activeEditLabelButton.childNodes[3].style.display = '';
  activeEditLabelButton.childNodes[7].style.display = 'none';
}

function switchToHighlightedDefaultVisibilityIcon(element) {
  element.childNodes[3].style.display = '';
  element.childNodes[7].style.display = 'none';
}

window.mouseEnterOnVisibility = (id, element) => {
  if (id === 'default') {
    highlightDefaultIcon(element);
  } else {
    highlightActiveIcon(element);
  }
};

window.mouseLeaveOnVisibility = (id, element) => {
  if (id === 'default') {
    dimDefaultIcon(element);
  } else {
    dimActiveIcon(element);
  }
};

window.mouseEnterOnLabelEdit = (element) => {
  if (!isLabelSelected) {
    highlightDefaultIcon(element);
  } else if (activeEditLabelButton.id !== element.id) {
    highlightDefaultIcon(element);
  } else {
    highlightActiveIcon(element);
  }
};

window.mouseLeaveOnLabelEdit = (element) => {
  if (!isLabelSelected) {
    dimDefaultIcon(element);
  } else if (activeEditLabelButton.id !== element.id) {
    dimDefaultIcon(element);
  } else {
    dimActiveIcon(element);
  }
};

function preventPasteOrMoveTextFromCreatingNewLine(element, inputEvent) {
  let finalText = '';
  if (inputEvent.inputType === 'insertFromPaste') {
    const noReturnCharactersText = element.innerHTML.replace(/(\r\n|\n|\r)/gm, '');
    element.innerHTML = noReturnCharactersText;
    finalText = noReturnCharactersText;
  } else {
    const temp = element.innerHTML;
    element.innerHTML = '';
    element.innerHTML = temp;
    finalText = temp;
  }
  setEndOfContentEditable(activeLabelTextElement);
  changeObjectLabelText(activeLabelId, finalText);
}

window.changeObjectLabelText = (innerHTML, element, inputEvent) => {
  if (element.offsetHeight > 30) {
    preventPasteOrMoveTextFromCreatingNewLine(element, inputEvent);
  } else {
    changeObjectLabelText(activeLabelId, innerHTML);
  }
  isLabelChanged = true;
};

window.highlightShapeFill = (id) => {
  highlightShapeFill(id);
};

window.defaultShapeFill = (id) => {
  defaultShapeFill(id);
};

// cannot do delete shape on label edit unless we switch the currently selected
// shape to the edited one - for all modes
// when starting to type, remove dropdown

// use this approach only if you want to vary the colours per label,
// otherwise use the style sheet method

// window.onEnter = (element) => {
//   element.style.backgroundColor = 'blue';
// };
//
// window.onLeave = (element) => {
//   element.style.backgroundColor = null;
// };
//
// <a onmouseover="onEnter(this)" onmouseleave="onLeave(this)"
// class="labelDropdownOption">Label 1</a>

function scrollHorizontallyToAppropriateWidth(text) {
  let myCanvas = document.createElement('canvas');
  const context = myCanvas.getContext('2d');
  context.font = '16pt Times New Roman';
  const metrics = context.measureText(text);
  if (metrics.width > 160) {
    tableElement.scrollLeft = metrics.width - 150;
  } else {
    tableElement.scrollLeft = 0;
  }
  myCanvas = null;
}

function setEndOfContentEditable(contentEditableElement) {
  let range;
  if (document.createRange) { // Firefox, Chrome, Opera, Safari, IE 9+
    range = document.createRange();
    range.selectNodeContents(contentEditableElement);
    // false means collapse to end rather than the start
    range.collapse(false);
    const selection = window.getSelection();
    // remove any selections already made
    selection.removeAllRanges();
    selection.addRange(range);
  } else if (document.selection) { // IE 8 and lower
    range = document.body.createTextRange();
    range.moveToElementText(contentEditableElement);
    // false means collapse to end rather than the start
    range.collapse(false);
    // make it the visible selection
    range.select();
  }
  scrollHorizontallyToAppropriateWidth(contentEditableElement.innerHTML);
}

function deleteAndAddLastRowToRefreshDiv(dropdownLabelsElement) {
  const labelOptions = getLabelOptions();
  dropdownLabelsElement.deleteRow(labelOptions.length - 1);
  if (labelOptions.length === 6) {
    labelOptionsElement.style.height = '116px';
  } else if (labelOptions.length === 7) {
    addLabelToDropdown('temp horizontal', dropdownLabelsElement);
  }
  window.setTimeout(() => {
    const lastLabel = labelOptions[labelOptions.length - 1];
    addLabelToDropdown(lastLabel.text, dropdownLabelsElement,
      labelOptions.length - 1, lastLabel.color.label);
    if (labelOptions.length === 7) {
      dropdownLabelsElement.deleteRow(6);
    }
  }, 0);
}

function initLabelEditing(id) {
  activeLabelTextElement = document.getElementById(`labelText${id}`);
  activeLabelTextElement.contentEditable = true;
  activeLabelTextElement.style.backgroundColor = 'white';
  activeLabelTextElement.style.borderColor = '#a39f9e';
  // give space for the texxt from the left border when editing
  activeLabelTextElement.style.paddingLeft = '2px';
  activeEditLabelButton = document.getElementById(`editButton${id}`);
  activeEditLabelButton.style.paddingRight = '3px';
  activeLabelId = id;
  setEndOfContentEditable(activeLabelTextElement);
  activeDropdownElements = document.getElementsByClassName(`labelDropdown${id}`);
  activeDropdownElements[0].classList.toggle('show');
  activeDropdownElements[0].scrollTop = 0;
  activeDropdownElements[0].scrollLeft = 0;
  deleteAndAddLastRowToRefreshDiv(activeDropdownElements[0]);
  // change this to match wider div
  // const labelDropdownOptions = getLabelOptions();
  // if (labelDropdownOptions.length > 5) {
  //   activeDropdownElements[0].style = 'width: 150px';
  // }
  isLabelSelected = true;
}

function selectShape() {
  const eventShape = {};
  eventShape.target = activeShape;
  polygonMouseDownEvents(eventShape);
  polygonMouseUpEvents(eventShape);
  if (activeShape.shapeName === 'bndBox') {
    programaticallySelectBoundingBox(activeShape);
  }
}

function deselectShape() {
  removeHighlightOfListLabel();
  polygonMouseDownEvents({});
  polygonMouseUpEvents({});
  if (activeShape.shapeName === 'bndBox') {
    programaticallyDeselectBoundingBox();
  }
}

window.labelBtnClick = (id) => {
  if (!getDefaultState()) {
    window.cancel();
  }
  highlightLabelInTheList(id);
  activeShape = getShapeById(id);
  if (!isVisibilitySelected) {
    if (getShapeVisibilityById(id)) {
      selectShape();
    } else if (activeShape.shapeName === 'bndBox') {
      programaticallyDeselectBoundingBox();
    } else {
      removePolygonPoints();
      removeEditedPolygonId();
      setShapeToInvisible();
    }
  } else {
    if (isVisibilityRestored) {
      selectShape();
    } else {
      removePolygonPoints();
      removeEditedPolygonId();
      setShapeToInvisible();
      if (activeShape.shapeName === 'bndBox') {
        programaticallyDeselectBoundingBox();
      }
    }
    isVisibilitySelected = false;
  }
};

function initiateEditing(id) {
  if (id !== getLastSelectedShapeId()) {
    setNewShapeSelectedViaLabelListState(true);
  } else {
    setNewShapeSelectedViaLabelListState(false);
  }
  setEditingLabelId(id);
  if (getAddingPolygonPointsState()) {
    // check if selected a different polygon to what was added, create state?
    resetCanvasToDefaultAfterAddPoints(id);
  } else {
    window.cancel();
  }
  activeShape = getShapeById(id);
  selectShape(id);
  initLabelEditing(id);
  availableListOptions = getLabelOptions();
  labelHasBeenDeselected = false;
  activeLabelElementId = `labelId${id}`;
}

function editLabel(id, element) {
  if (id !== activeLabelId) {
    initiateEditing(id);
    switchToHighlightedActiveIcon(element);
  } else if (deselectedEditing) {
    deselectedEditing = false;
    labelHasBeenDeselected = true;
  } else if (!deselectedEditing) {
    initiateEditing(id);
    switchToHighlightedActiveIcon(element);
  }
}

window.visibilityBtnClick = (id, element) => {
  changeShapeVisibilityById(id);
  isVisibilityRestored = changeLabelVisibilityById(id);
  isVisibilitySelected = true;
  if (element.id === 'default') {
    element.id = 'highlighted';
    switchToHighlightedActiveIcon(element);
  } else {
    element.id = 'default';
    switchToHighlightedDefaultVisibilityIcon(element);
  }
};

window.labelDblClicked = (id) => {
  initLabelEditing(id);
  const editElement = document.getElementById(`editButton${id}`);
  switchToActiveIcon(editElement);
};

window.editLabelBtnClick = (id, element) => {
  // remove visibility button when editing
  // const visibilityButton = document.getElementById(`visibilityButton${id}`);
  // visibilityButton.style.display = 'none';
  // const labelButton = document.getElementById(`editButton${id}`);
  // labelButton.style.marginLeft = '4px';
  // labelButton.style.marginRight = '2px'
  editLabel(id, element);
};

function trimLabelText() {
  const trimmedText = activeLabelTextElement.innerHTML.trim();
  activeLabelTextElement.innerHTML = trimmedText;
  changeObjectLabelText(activeLabelId, trimmedText);
}

function removeLabelDropDownContent() {
  if (activeDropdownElements[0].classList.contains('show')) {
    activeDropdownElements[0].classList.remove('show');
  }
  isLabelSelected = false;
}

function resetLabelElement() {
  trimLabelText();
  removeLabelDropDownContent();
  activeLabelTextElement.contentEditable = false;
  activeLabelTextElement.style.backgroundColor = null;
  activeLabelTextElement.style.borderColor = 'transparent';
  activeLabelTextElement.style.paddingLeft = '';
  activeEditLabelButton.style.paddingRight = '5px';
  tableElement.scrollLeft = 0;
  setEditingLabelId(null);
  isLabelChanged = false;
}

function stopEditing() {
  activeShape = false;
  switchToDefaultIcon();
  resetLabelElement();
}

function initialiseParentElement() {
  return document.createElement('div');
}

function addLabelToDropdown(labelText, tempEle, id, color) {
  const labelElement = initialiseParentElement();
  labelElement.innerHTML = `<div class="labelDropdownOption" id="labelOption${id}" onMouseEnter="hoverLabelOption(this, '${color}')" onMouseLeave="labelOptionMouseOut(this)">${labelText}</div>`;
  const newRow = tempEle.insertRow(-1);
  const cell = newRow.insertCell(0);
  cell.appendChild(labelElement);
}

function addLabelToLists(labelText, color) {
  const labelElement = initialiseParentElement();
  labelElement.innerHTML = `<div class="labelDropdownOption" onClick="selectLabelOption(innerHTML)" onMouseEnter="hoverLabelOption(this, '${color}')" onMouseLeave="labelOptionMouseOut(this)">${labelText}</div>`;
  const newRow = labelOptionsElement.insertRow(-1);
  const cell = newRow.insertCell(0);
  cell.appendChild(labelElement);
}

function purgeOptionsFromLabelElement() {
  labelOptionsElement.innerHTML = '';
}

function resetLabelOptions() {
  purgeOptionsFromLabelElement();
  getLabelOptions().forEach((label) => { addLabelToLists(label.text, label.color.label); });
}

function updateLabellerPopupOptionsList() {
  resetLabelOptions();
}

function addNewLabelToLabelOptions(text) {
  if (isLabelChanged) {
    addToLabelOptions(text);
    const newLabelColor = getLabelColor(text);
    changeShapeColorById(activeLabelId, newLabelColor);
    changeLabelColor(newLabelColor.label);
    repopulateDropdown();
    updateLabellerPopupOptionsList();
  }
}

window.labelTextKeyDown = (event) => {
  if (event.key === 'Enter') {
    addNewLabelToLabelOptions(activeLabelTextElement.innerHTML);
    stopEditing();
  }
  window.setTimeout(() => {
    if (lastSelectedLabelOption) {
      lastSelectedLabelOption.style.backgroundColor = '';
      lastSelectedLabelOption.id = '';
    }
    let found = false;
    for (let i = 0; i < availableListOptions.length - 1; i += 1) {
      if (availableListOptions[i].text === activeLabelTextElement.innerHTML) {
        lastSelectedLabelOption = activeDropdownElements[0].childNodes[0].childNodes[i * 2].childNodes[0].childNodes[0];
        lastSelectedLabelOption.style.backgroundColor = availableListOptions[i].color.label;
        found = true;
        lastSelectedLabelOption.id = 'used';
        lastSelectedLabelOption.scrollIntoViewIfNeeded();
        break;
      }
    }
    if (!found) {
      const lastLabelOptionIndex = availableListOptions.length - 1;
      if (availableListOptions[lastLabelOptionIndex].text === activeLabelTextElement.innerHTML) {
        lastSelectedLabelOption = activeDropdownElements[0].childNodes[0].childNodes[lastLabelOptionIndex * 2].childNodes[0].childNodes[0];
        lastSelectedLabelOption.style.backgroundColor = availableListOptions[lastLabelOptionIndex].color.label;
        lastSelectedLabelOption.id = 'used';
        lastSelectedLabelOption.scrollIntoViewIfNeeded();
      }
    }
  }, 0);
};

function moveSelectedLabelToFrontOfLabelOptions(id, text) {
  if (id !== 0) {
    sendLabelOptionToFront(id);
    const newLabelColor = getLabelColor(text);
    changeShapeColorById(activeLabelId, newLabelColor);
    changeLabelColor(newLabelColor.label);
    repopulateDropdown();
    updateLabellerPopupOptionsList();
  }
}

window.onmousedown = (event) => {
  // should be is editing
  if (isLabelSelected) {
    if (event.target.matches('.labelDropdownOption')) {
      const newText = event.target.innerHTML;
      activeLabelTextElement.innerHTML = newText;
      changeObjectLabelText(activeLabelId, newText);
      // fix here as after moving polygon, points stay
      removeLabelDropDownContent();
      stopEditing();
      moveSelectedLabelToFrontOfLabelOptions(event.target.id.substring(11, 12), newText);
    } else if (event.target.id === `labelText${activeLabelId}` || event.target.matches('.dropdown-content')) {
      // do nothing
    } else if (event.target.id === `editButton${activeLabelId}`) {
      if (!labelHasBeenDeselected) {
        deselectedEditing = true;
        switchToHighlightedDefaultIcon();
        addNewLabelToLabelOptions(activeLabelTextElement.innerHTML);
        resetLabelElement();
      }
    } else if (event.target.nodeName === 'CANVAS' || event.target.id === 'toolsButton' || event.target.id === activeLabelElementId) {
      addNewLabelToLabelOptions(activeLabelTextElement.innerHTML);
      stopEditing();
    } else {
      addNewLabelToLabelOptions(activeLabelTextElement.innerHTML);
      stopEditing();
      deselectShape();
    }
  }
};

// decide if this is necessary
//    window.setTimeout(function ()
// {
//   activeLabelTextElement.focus();
//   setEndOfContentEditable(activeLabelTextElement);
// }, 0);

function addLabelToList(labelText, id, labelColor) {
  const labelElement = initialiseParentElement();
  labelElement.id = id;
  labelElement.innerHTML = createLabelElementMarkup(labelText, id, labelColor);
  const newRow = tableElement.insertRow(-1);
  const cell = newRow.insertCell(0);
  cell.appendChild(labelElement);
  // scroll to left on new shape insert in order to see available funcitonality
  tableElement.scrollLeft = 0;
  repopulateDropdown();
  cell.scrollIntoView();
}

function removeLabelFromList(id) {
  if (id != null) {
    let index = 0;
    const tableList = tableElement.childNodes[1].childNodes;
    while (index !== tableList.length) {
      if (parseInt(tableList[index].childNodes[0].childNodes[0].id, 10) === id) {
        tableList[index].remove();
        break;
      }
      index += 1;
    }
  }
  // tableElement.deleteRow(0);
}

export {
  initialiseLabelListFunctionality, addLabelToList,
  removeLabelFromList, moveSelectedLabelToFrontOfLabelOptions,
};
