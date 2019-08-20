'use strict';
// eslint-disable-next-line no-unused-vars
/* global var, cuid, ? */


const STORE = {
  items: [
    {id: cuid(), name: 'apples', checked: false, isEditing: false},
    {id: cuid(), name: 'oranges', checked: false, isEditing: false},
    {id: cuid(), name: 'milk', checked: true, isEditing: false},
    {id: cuid(), name: 'bread', checked: false, isEditing: false}
  ],
  hideCompleted: false,
  searchItem: null,
};

function generateItemElement(item) {
  let itemMainTitle;
  if (item.isEditing) {
    itemMainTitle = `
      <form id="edit-item-name-form">
        <input type="text" name="edit-name" class="js-edit-item-name" value="${item.name}" />
      </form>
    `;
  } else {
    itemMainTitle = `
      <span class="shopping-item js-shopping-item ${item.checked ? 'shopping-item__checked' : ''}">
        ${item.name}
      </span>`;
  }

  const disabledStatus = item.isEditing ? 'disabled' : '';
  return `
    <li data-item-id="${item.id}">
      ${itemMainTitle}
      <div class="shopping-item-controls">
        <button class="shopping-item-edit js-item-edit">
          <span class="button-label">edit</span>
        </button>
        <button class="shopping-item-toggle js-item-toggle" ${disabledStatus}>
            <span class="button-label">check</span>
        </button>
        <button class="shopping-item-delete js-item-delete" ${disabledStatus}>
            <span class="button-label">delete</span>
        </button>
      </div>
    </li>`;
}


function generateShoppingItemsString(shoppingList) {
  console.log('Generating shopping list element');

  const items = shoppingList.map((item) => generateItemElement(item));
  
  return items.join('');
}


function renderShoppingList() {
  // render the shopping list in the DOM
  console.log('`renderShoppingList` ran');

  // set up a copy of the store's items in a local variable that we will reassign to a new
  // version if any filtering of the list occurs
  let filteredItems = STORE.items;

  // if the `hideCompleted` property is true, then we want to reassign filteredItems to a version
  // where ONLY items with a "checked" property of false are included
  if (STORE.hideCompleted) {
    filteredItems = filteredItems.filter(item => !item.checked);
  }

  if(STORE.searchItem) {
    filteredItems = filteredItems.filter( item =>  
      item.name.includes(STORE.searchItem));
  }

  // at this point, all filtering work has been done (or not done, if that's the current settings), so
  // we send our `filteredItems` into our HTML generation function 
  const shoppingListItemsString = generateShoppingItemsString(filteredItems);

  // insert that HTML into the DOM
  $('.js-shopping-list').html(shoppingListItemsString);
}


function addItemToShoppingList(itemName) {
  console.log(`Adding "${itemName}" to shopping list`);
  STORE.items.push({name: itemName, checked: false});
}

function handleNewItemSubmit() {
  $('#js-shopping-list-form').submit(function(event) {
    event.preventDefault();
    console.log('`handleNewItemSubmit` ran');
    const newItemName = $('.js-shopping-list-entry').val();
    $('.js-shopping-list-entry').val('');
    addItemToShoppingList(newItemName);
    renderShoppingList();
  });
}

function toggleCheckedForListItem(itemId) {
  console.log('Toggling checked property for item with id ' + itemId);
  const item = STORE.items.find(item => item.id === itemId);
  item.checked = !item.checked;
}


function getItemIdFromElement(item) {
  return $(item)
    .closest('li')
    .data('item-id');
}

function handleItemCheckClicked() {
  $('.js-shopping-list').on('click', '.js-item-toggle', event => {
    console.log('`handleItemCheckClicked` ran');
    const id = getItemIdFromElement(event.currentTarget);
    toggleCheckedForListItem(id);
    renderShoppingList();
  });
}


// name says it all. responsible for deleting a list item.
function deleteListItem(itemId) {
  console.log(`Deleting item with id  ${itemId} from shopping list`);

  // as with `addItemToShoppingLIst`, this function also has the side effect of
  // mutating the global STORE value.
  //
  // First we find the index of the item with the specified id using the native
  // Array.prototype.findIndex() method. Then we call `.splice` at the index of 
  // the list item we want to remove, with a removeCount of 1.
  const itemIndex = STORE.items.findIndex(item => item.id === itemId);
  STORE.items.splice(itemIndex, 1);
}


function handleDeleteItemClicked() {
  // like in `handleItemCheckClicked`, we use event delegation
  $('.js-shopping-list').on('click', '.js-item-delete', event => {
    // get the index of the item in STORE
    const itemIndex = getItemIdFromElement(event.currentTarget);
    // delete the item
    deleteListItem(itemIndex);
    // render the updated shopping list
    renderShoppingList();
  });
}

// Toggles the STORE.hideCompleted property
function toggleHideFilter() {
  STORE.hideCompleted = !STORE.hideCompleted;
}

// Places an event listener on the checkbox for hiding completed items
function handleToggleHideFilter() {
  $('.js-hide-completed-toggle').on('click', () => {
    toggleHideFilter();
    renderShoppingList();
  });
}

function setSearchItem(val) {
  STORE.searchItem = val;
}

// Will accept user text input, then search for corresponding item in STORE,
// Only show items matching inputed text
function handleSearchFor() {
  $('.js-shopping-list-search').on('keyup', function (event) {
    const val = $(event.currentTarget).val();
    console.log(val);
    setSearchItem(val);
    renderShoppingList();
  });
}

function itemIsBeingEdited(selectedId, isEditing) {
  const targetItem = STORE.items.find(item => item.id === selectedId);
  targetItem.isEditing = isEditing;
}

function handleEditButtonClick() {
  $('.js-shopping-list').on('click', '.shopping-item-edit', event => {
    const selectedId = getItemIdFromElement(event.currentTarget);
    itemIsBeingEdited(selectedId, true);
    renderShoppingList();
  });
}

function editItemName(selectedId, newName) {
  const targetItem = STORE.items.find(item => item.id === selectedId);
  targetItem.name = newName;
}

// Will allow editing of existing item names
function handleEditItem() {
  $('.js-shopping-list').on('submit', '#edit-item-name-form', function(event) {
    event.preventDefault();
    const selectedId = getItemIdFromElement(event.target);
    const newName = $('.js-edit-item-name').val();
    editItemName(selectedId, newName);
    itemIsBeingEdited(selectedId, false);
    renderShoppingList();
  });
}

// this function will be our callback when the page loads. it's responsible for
// initially rendering the shopping list, and activating our individual functions
// that handle new item submission and user clicks on the "check" and "delete" buttons
// for individual shopping list items.
function handleShoppingList() {
  renderShoppingList();
  handleNewItemSubmit();
  handleEditButtonClick();
  handleEditItem();
  handleItemCheckClicked();
  handleDeleteItemClicked();
  handleToggleHideFilter();
  handleSearchFor();
}

// when the page loads, call `handleShoppingList`
$(handleShoppingList);