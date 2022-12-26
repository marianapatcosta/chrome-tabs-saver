const saveTabsGroupForm = document.getElementById('save-tabs-group')
const tabsGroupNameInput = document.getElementById('group-name-input')

const tabsGroupsList = document.getElementById('tabs-groups-list')
const tabsGroupsHeading = document.getElementById('tabs-groups-heading')
const addTabSelect = document.getElementById('add-tab')
const removeTabSelect = document.getElementById('remove-tab')

const MAX_NAME_LENGTH = 30
const STORAGE_KEY = 'savedTabsGroups'

const renderTabsGroups = (tabsGroups) => {
  tabsGroupsList.innerHTML = ''
  if (!tabsGroups.length) {
    tabsGroupsList.innerText = 'No tabs groups to display'
    return
  }
  tabsGroups.forEach((tabsGroup) => {
    const li = document.createElement('li')

    const openButton = document.createElement('button')
    openButton.innerText = tabsGroup.name
    openButton.title = `Open tabs group ${tabsGroup.name}`
    openButton.setAttribute(
      'aria-label',
      `Click to open tabs group ${tabsGroup.name}`
    )
    openButton.addEventListener('click', () => openTabsGroup(tabsGroup))

    const deleteButton = document.createElement('button')
    deleteButton.innerHTML = '<i class="fa-solid fa-trash"></i>'
    deleteButton.title = `Delete tabs group ${tabsGroup.name}`
    deleteButton.setAttribute(
      'aria-label',
      `Click to delete tabsGroup ${tabsGroup.name}`
    )
    deleteButton.addEventListener('click', (event) =>
      deleteTabsGroup(event, tabsGroup)
    )

    li.appendChild(openButton)
    li.appendChild(deleteButton)
    tabsGroupsList.appendChild(li)
  })
}

const renderSelectOptions = (selectElement, placeholderText, tabsGroups) => {
  selectElement.innerHTML = ''
  const placeholder = document.createElement('option')
  placeholder.innerText = placeholderText
  placeholder.disabled = true
  placeholder.selected = true
  placeholder.hidden = true
  placeholder.value = ''
  selectElement.append(placeholder)
  tabsGroups.forEach((tabGroup) => {
    const option = document.createElement('option')
    option.innerText = tabGroup.name
    option.value = tabGroup.name
    selectElement.append(option)
  })
  selectElement.disabled = !tabsGroups.length
}

const renderSelectOptionsForAddRemoveTabs = (tabsGroups) => {
  renderSelectOptions(addTabSelect, 'Add tab to:', tabsGroups)
  renderSelectOptions(removeTabSelect, 'Remove tab from:', tabsGroups)
}

const saveTabsGroup = (event) => {
  event.preventDefault()
  const tabsGroupName = tabsGroupNameInput.value
  if (!tabsGroupName) {
    return alert('Please enter a name for this tabs group!')
  }

  if (tabsGroupName.length > MAX_NAME_LENGTH) {
    return alert('Please shorten the name for this tabs group! (Max 30 chars).')
  }

  chrome.tabs.query({ windowType: 'normal', currentWindow: true }, (tabs) => {
    const tabsUrls = (urls = tabs.map(({ url }) => url))
    chrome.storage.local.get(STORAGE_KEY, (items) => {
      //     chrome.storage.local.clear()
      const savedTabsGroups = items.savedTabsGroups || []
      if (savedTabsGroups.some(({ name }) => name === tabsGroupName)) {
        return alert(
          `${tabsGroupName} already exists. Please enter a new name!`
        )
      }
      const updatedSavedTabsGroup = [
        { name: tabsGroupName, tabsUrls },
        ...savedTabsGroups,
      ]

      chrome.storage.local.set({ [STORAGE_KEY]: updatedSavedTabsGroup })
      saveTabsGroupForm.reset()
      renderSelectOptionsForAddRemoveTabs(updatedSavedTabsGroup)
      renderTabsGroups(updatedSavedTabsGroup)
    })
  })
}

const openTabsGroup = (tabsGroup) => {
  chrome.windows.create({ url: tabsGroup.tabsUrls })
}

const deleteTabsGroup = (event, tabsGroup) => {
  event.stopPropagation()
  chrome.storage.local.get(STORAGE_KEY, (items) => {
    const savedTabsGroups = items.savedTabsGroups || []
    const updatedSavedTabsGroup = savedTabsGroups.filter(
      ({ name }) => name !== tabsGroup.name
    )
    chrome.storage.local.set({ [STORAGE_KEY]: updatedSavedTabsGroup })
    renderTabsGroups(updatedSavedTabsGroup)
    renderSelectOptionsForAddRemoveTabs(updatedSavedTabsGroup)
  })
}

const addOrRemoveTabToSavedGroup = (event, getUpdatedTabsGroupsCb) => {
  chrome.tabs.query(
    {
      active: true,
      windowType: 'normal',
      currentWindow: true,
    },
    (tabs) => {
      const newTabUrl = tabs[0].url
      const selectedTabsGroupName = event.target.value

      chrome.storage.local.get(STORAGE_KEY, (items) => {
        const savedTabsGroups = items.savedTabsGroups || []
        const { updatedSavedTabsGroup, onSuccessAlertText } =
          getUpdatedTabsGroupsCb(
            savedTabsGroups,
            newTabUrl,
            selectedTabsGroupName
          )
        chrome.storage.local.set({ [STORAGE_KEY]: updatedSavedTabsGroup })
        alert(onSuccessAlertText)
      })
    }
  )
}

const addTabToSavedGroup = (tabsGroups, newTabUrl, selectedTabsGroupName) => {
  const updatedSavedTabsGroup = tabsGroups.map((tabsGroup) => {
    if (tabsGroup.name !== selectedTabsGroupName) {
      return tabsGroup
    }
    if (tabsGroup.tabsUrls.some((url) => url === newTabUrl)) {
      alert(`Current tab already exists in ${selectedTabsGroupName}!`)
      return tabsGroup
    }
    return {
      name: tabsGroup.name,
      tabsUrls: [...tabsGroup.tabsUrls, newTabUrl],
    }
  })
  addTabSelect.value = ''
  renderSelectOptions(addTabSelect, 'Add tab to:', tabsGroups)
  return {
    updatedSavedTabsGroup,
    onSuccessAlertText: `Current tab was added to ${selectedTabsGroupName}!`,
  }
}

const removeTabFromSavedGroup = (
  tabsGroups,
  newTabUrl,
  selectedTabsGroupName
) => {
  const updatedSavedTabsGroup = tabsGroups.map((tabsGroup) => {
    if (tabsGroup.name !== selectedTabsGroupName) {
      return tabsGroup
    }
    if (tabsGroup.tabsUrls.every((url) => url !== newTabUrl)) {
      alert(`Current tab does not exist in ${selectedTabsGroupName}!`)
      return tabsGroup
    }
    renderSelectOptions(removeTabSelect, 'Remove tab from:', tabsGroups)
    return {
      name: tabsGroup.name,
      tabsUrls: tabsGroup.tabsUrls.filter((url) => url !== newTabUrl),
    }
  })

  return {
    updatedSavedTabsGroup,
    onSuccessAlertText: `Current tab was removed from ${selectedTabsGroupName}!`,
  }
}

saveTabsGroupForm.addEventListener('submit', saveTabsGroup)
addTabSelect.addEventListener('change', (event) =>
  addOrRemoveTabToSavedGroup(event, addTabToSavedGroup)
)
removeTabSelect.addEventListener('change', (event) =>
  addOrRemoveTabToSavedGroup(event, removeTabFromSavedGroup)
)

chrome.storage.local.get(STORAGE_KEY, (items) => {
  const savedTabsGroups = items.savedTabsGroups || []
  renderTabsGroups(savedTabsGroups)
  renderSelectOptionsForAddRemoveTabs(savedTabsGroups)
})
