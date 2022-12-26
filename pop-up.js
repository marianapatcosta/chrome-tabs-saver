const saveTabsGroupForm = document.getElementById('save-form')
const tabsGroupNameInput = document.getElementById('group-name-input')

const copyButton = document.getElementById('copy-button')

const MAX_NAME_LENGTH = 30

const updateTexts = () => {
  tabsGroupNameInput.placeholder = fromUnit
  convertedInput.placeholder = fromUnit === UNITS.PX ? UNITS.REM : UNITS.PX
}

/* updateTexts(); */

const saveTabsGroup = (event) => {
  event.preventDefault()
  const tabsGroupName = tabsGroupNameInput.value
  if (!tabsGroupName) {
    return alert('Please enter a name for this tabs group!')
  }

  if (tabsGroupName.length > MAX_NAME_LENGTH) {
    return alert('Please shorten the name for this tabs group! (Max 30 chars).')
  }

  /*  chrome.browserAction.onClicked.addListener(function (activeTab) { */
  /* var loaderURL = chrome.extension.getURL('dashboard.html')
  chrome.tabs.create({ url: loaderURL }) */
  chrome.runtime.sendMessage({
    action: 'save_tabs',
    /*       tab: tab, */
  })
  console.log(111111, chrome.runtime.onMessage)
  /*   })
   */
  /* chrome.runtime.sendMessage({
      action: 'save_tabs',
      tab: tab,
    }) */

  /*   chrome.runtime.sendMessage({
   action: 'save_tabs',
   tab: tab,
 }) */
  console.log(6666, tabsGroupName, chrome.tabs)

  saveTabsGroupForm.reset()

  // tabsGroupNameInput.value =  '';
}

document.getElementById('save-button').addEventListener('click', function () {
  // send a message to the background script
  chrome.runtime.sendMessage({
    type: 'button_clicked',
    payload: 'Hello from the popup!',
  })
})
saveTabsGroupForm.addEventListener('submit', saveTabsGroupForm)

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'extract_tabs_urls_response') {
    // display the array of URLs in the page
    alert('hello', message.tabsUrls)
  }
})
