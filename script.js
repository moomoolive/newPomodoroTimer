function createApp() {

    var appStateKey = "state"
    function getCachedState() {
        var state = window.localStorage.getItem(appStateKey)
        if (state) {
            return JSON.parse(state)
        } else {
            return null
        }
    }
    
    var app = window.document.getElementById('app')
    var title = "Pomodoro Timer"
    var defaultState = {
        breakSessionMinutes: 5,
        workSessionMinutes: 25,
        longBreakMinutes: 30,
        sessionsUntilLongBreak: 4,
        darkMode: false
    }
    var state = getCachedState() || defaultState

    function cacheState() {
        return window.localStorage.setItem(appStateKey, JSON.stringify(state))
    }

    function setState(key, value) {
        state[key] = value
        cacheState()
        return state[key]
    }
    function incrementState(targetKey) {
        return setState(targetKey, state[targetKey] + 1)
    }
    function decrementState(targetKey, minimumValue, errorMessage) {
        if (state[targetKey] <= minimumValue) {
            window.alert(errorMessage)
            return -1
        } else {
            return setState(targetKey, state[targetKey] - 1)
        }
    }
    function createDOMElement(type, classList) {
        var element = window.document.createElement(type)
        if (typeof classList !== 'string') {
            classList = ""
        }
        element.className += classList
        return element
    }
    function createIcon(iconClass, additionalClasses) {
        var classes = iconClass
        if (typeof additionalClasses === 'string') {
            classes = classes + " " + additionalClasses
        }
        return createDOMElement("i", classes)
    }

    return {
        append: function(element) {
            return app.appendChild(element)
        },
        clearAllChildren() {
            return app.innerHTML = ""
        },
        getTitle() {
            return title
        },
        renderFooter() {
            var footerContainer = createDOMElement("div", "footer")
            footerContainer.setAttribute("id", "footer")

            var textClass = state.darkMode ? " dark-mode" : ""
            var toSourceCodeLink = createDOMElement("a", "footer-text" + textClass)
            toSourceCodeLink.setAttribute("href", "https://github.com/moomoolive/newPomodoroTimer")
            toSourceCodeLink.setAttribute("target", "_blank")

            var repositoryIcon = createIcon("fab fa-github-alt", "footer-icon")
            var sourceLinkText = createDOMElement("span")
            sourceLinkText.innerText = "Source Code"

            toSourceCodeLink.appendChild(repositoryIcon)
            toSourceCodeLink.appendChild(sourceLinkText)

            footerContainer.appendChild(toSourceCodeLink)

            window.document.body.appendChild(footerContainer)
        },
        getState(key) {
            return state[key] !== undefined ? state[key] : null
        },
        incrementWorkSession() {
            return incrementState("workSessionMinutes")
        },
        decrementWorkSession() {
            return decrementState(
                "workSessionMinutes", 
                5, 
                "Work sessions must be at least 5 minutes"
            )
        },
        incrementBreakSession() {
            return incrementState("breakSessionMinutes")
        },
        decrementBreakSession() {
            return decrementState(
                "breakSessionMinutes", 
                1, 
                "Break sessions must be at least 1 minute"
            )
        },
        incrementLongBreak() {
            return incrementState("longBreakMinutes")
        },
        decrementLongBreak() {
            return decrementState(
                "longBreakMinutes", 
                10, 
                "Long breaks must be at least 10 minutes"
            )
        },
        incrementWorkSessions() {
            return incrementState("sessionsUntilLongBreak")
        },
        decrementWorkSessions() {
            return decrementState(
                "sessionsUntilLongBreak", 
                2, 
                "You must have at least 2 work sessions"
            )
        },
        toggleDarkMode() {
            setState("darkMode", !state.darkMode)
            // when dark mode is toggle whole app is reloaded
            // as it's easier than creating two seperate workflows, one for 
            // for setting colors on initial page render and
            // one for once dark mode is mutated by user
            var milliseconds = 400 
            return window.setTimeout(function() {
                return window.location.reload()
            }, milliseconds)
        },
        toggleFullPageAnimation() {
            return app.classList.toggle("animate-route")
        },
        setupColorScheme() {
            if (!state.darkMode) {
                return
            }
            var backgroundColor = "#262626"
            var textColor = "#FCFCFC"
            window.document.body.style.background = backgroundColor
            window.document.body.style.color = textColor
            return app.classList.toggle("dark-mode")

        },
        globalMethods: {
            createDOMElement: createDOMElement, 
            createWindowEvent: function(eventName) {
                var event = window.document.createEvent("Event")
                event.initEvent(eventName, true, true)
                return window.dispatchEvent(event)
            },
            createIcon: createIcon,
            addDarkModeClass() {
                return state.darkMode ? " dark-mode" : ""
            },
        }
    }
}

function createRouter(routes, app) {

    var routerEventSignature = "router-"
    var routerEvents = {
        toTimer: routerEventSignature + "to-timer",
        toHome: routerEventSignature + "to-home",
        routeChange: routerEventSignature + "-change"
    }

    function getRoute(pathName) {
        // "*" stands for 404 page
        return routes[pathName] || routes["*"]
    }
    function getCurrentRoute() {
        return getRoute(window.location.pathname)
    }
    function createView() {
        return app.globalMethods.createDOMElement("div", "view-container")
    }
    function createViewEvent(view) {
        return function(eventName) {
            var event = window.document.createEvent("Event")
            event.initEvent(eventName, true, true)
            return view.dispatchEvent(event)
        }
    }

    return {
        renderRoute: function() {
            var route = getCurrentRoute()
            // injects app into every view so that it can have
            // access to the app's state (aka global state)
            // I did this to avoid mutating the "window" object
            var view = createView()
            var renderedViewComponents = route.render(app, view, createViewEvent(view), routerEvents)
            for (var component of renderedViewComponents) {
                view.appendChild(component)
            }
            app.append(view)
            return app.toggleFullPageAnimation()
        },
        pushToRoute(pathName) {
            app.toggleFullPageAnimation()
            var milliseconds = 1_000
            // this delay gives time for the route animations to 
            // render correctly
            return window.setTimeout(function() {
                app.clearAllChildren()
                window.history.pushState(null, app.getTitle(), pathName)
                return app.globalMethods.createWindowEvent(routerEvents.routeChange)
            }, milliseconds)
        },
        eventNames: routerEvents
    }
}

function homeRender(app, _, _, routerEvents) {
    var localState = {
        timerOptions: [
            { 
                title: "Break Session", 
                targetStateKey: "breakSessionMinutes",
                incrementFunction: app.incrementBreakSession,
                decrementFunction: app.decrementBreakSession
            },
            { 
                title: "Work Session", 
                targetStateKey: "workSessionMinutes",
                incrementFunction: app.incrementWorkSession,
                decrementFunction: app.decrementWorkSession
            },
            { 
                title: "Long Break", 
                targetStateKey: "longBreakMinutes",
                incrementFunction: app.incrementLongBreak,
                decrementFunction: app.decrementLongBreak
            },
            { 
                title: "Long Break After", 
                incrementType: "sessions", 
                targetStateKey: "sessionsUntilLongBreak",
                incrementFunction: app.incrementWorkSessions,
                decrementFunction: app.decrementWorkSessions 
            },
        ]
    }
    var methods = {
        createIncrementButtonIcon: function(isDecrementing) {
            var iconSuffix = isDecrementing ? "minus" : "plus"
            var iconName = "fas fa-" + iconSuffix
            return app.globalMethods.createIcon(iconName)
        }
    }
    var componentRenderFunctions = {
        createToTimerButton: function(app) {
            var toTimerButtonContainer = app.globalMethods.createDOMElement("div", "to-timer-button-container")
            var toTimerButton = app.globalMethods.createDOMElement("button", "to-timer-button")
            toTimerButton.onclick = function() {
                return app.globalMethods.createWindowEvent(routerEvents.toTimer)
            }
            var toTimerIcon = app.globalMethods.createIcon("fas fa-play")
            toTimerButton.appendChild(toTimerIcon)
            toTimerButtonContainer.appendChild(toTimerButton)
            return toTimerButtonContainer
        },
        createSettingsHeader: function(app) {
            var settingsHeader = app.globalMethods.createDOMElement("div", "settings-header" + app.globalMethods.addDarkModeClass())
            var settingsText = window.document.createElement("span")
            settingsText.innerText = "Settings"
            var settingsIcon = app.globalMethods.createIcon("fas fa-sliders-h", "settings-icon")
            settingsHeader.appendChild(settingsIcon)
            settingsHeader.appendChild(settingsText)
            return settingsHeader
        },
        createOptionsContainer: function(app) {
            return app.globalMethods.createDOMElement("div", "options-selection-container")
        },
        createOptionsDetailContainer: function (option, app) {
            var optionDetailsContainer = app.globalMethods.createDOMElement("div", "option-details-container")
            optionDetailsContainer.setAttribute("id", option.title + " setting")
            return optionDetailsContainer
        },
        createSettingTitle: function(option, optionDetailsContainer, app) {
            var title = app.globalMethods.createDOMElement("div", "option-title")
            title.innerText = option.title
            // used a closure here to capture the title and container of this
            // particular iteration; without it every onclick event would always
            // run the 'onclick' function the last element iterated over.
            title.onclick = (function(options) {
                return function() {
                    options.container.classList.toggle("show")
                    var milliseconds = 1_000
                    if (!options.title.classList.contains('open-mode')) {
                        milliseconds = 0
                    }
                    // setTimeout is used here because I only want the border
                    // radius of the clickable area (the title) to change
                    // once all dropdown contents have disappeared
                    return window.setTimeout(function() {
                        return options.title.classList.toggle("open-mode")
                    }, milliseconds)
                }
            })({ title: title, container: optionDetailsContainer });
            return title
        },
        createButtonThatIncrements: function(option, number, isDecrementing, app) {
            var type = isDecrementing ? "decrement" : "increment"
            var CSSClass = type + "-interval"
            var button = app.globalMethods.createDOMElement("button", "interval-control-button " + CSSClass)
            var targetOptionFunction = type + "Function"
            button.onclick = (function(options) {
                return function() {
                    // returns -1 if mutation was unsuccessful
                    var newValue = options.incrementingFunction()
                    if (newValue !== -1) {
                        options.targetNumber.innerText = newValue.toString()
                    }
                }
            })({ incrementingFunction: option[targetOptionFunction], targetNumber: number });
            var icon = methods.createIncrementButtonIcon(isDecrementing)
            button.appendChild(icon)
            return button
        },
        createDarkModeButton(app) {
            var container = app.globalMethods.createDOMElement("div", "dark-mode-button-container")
            var darkModeButton = app.globalMethods.createDOMElement("button", "dark-mode-button")
            darkModeButton.onclick = app.toggleDarkMode
            var iconName = app.getState("darkMode") ? "moon" : "sun"
            var darkModeIcon = app.globalMethods.createIcon("fas fa-" + iconName, "dark-mode-icon" + app.globalMethods.addDarkModeClass())
            darkModeButton.appendChild(darkModeIcon)
            container.appendChild(darkModeButton)
            return container
        }
    }
    console.log("Dark Mode", app.getState("darkMode"))

    var darkModeButton = componentRenderFunctions.createDarkModeButton(app)
    var toTimerButtonContainer = componentRenderFunctions.createToTimerButton(app)
    var settingsHeader = componentRenderFunctions.createSettingsHeader(app)
    var optionsContainer = componentRenderFunctions.createOptionsContainer(app)

    for (var i = 0; i < localState.timerOptions.length; i++) {
        var option = localState.timerOptions[i]

        var rootOptionElement = app.globalMethods.createDOMElement("div", "option-container")
        var optionDetailsContainer = componentRenderFunctions.createOptionsDetailContainer(option, app)

        var title = componentRenderFunctions.createSettingTitle(option, optionDetailsContainer, app)

        var numberDiv = app.globalMethods.createDOMElement("div", "option-interval-number")

        var number = window.document.createElement("div")
        number.innerText = app.getState(option.targetStateKey).toString()

        var incrementButton = componentRenderFunctions
            .createButtonThatIncrements(option, number, false, app)
        numberDiv.appendChild(incrementButton)
        numberDiv.appendChild(number)

        var intervalMetricDiv = app.globalMethods.createDOMElement("div", "option-interval-metric-container")

        var intervalMetric = app.globalMethods.createDOMElement("div", "option-interval-metric")
        var defaultIncrementType = "min"
        intervalMetric.innerText = option.incrementType || defaultIncrementType

        var decrementButton = componentRenderFunctions
            .createButtonThatIncrements(option, number, true, app)

        intervalMetricDiv.appendChild(intervalMetric)
        intervalMetricDiv.appendChild(decrementButton)

        optionDetailsContainer.appendChild(numberDiv)
        optionDetailsContainer.appendChild(intervalMetricDiv)
        

        for (var childElement of [title, optionDetailsContainer]) {
            rootOptionElement.appendChild(childElement)
        }
        optionsContainer.appendChild(rootOptionElement)
    }

    return [
        darkModeButton,
        toTimerButtonContainer,
        settingsHeader,
        optionsContainer
    ]
}

function timerRender(app, view, createViewEvent, routerEvents) {
    var localState = {
        originalCountdownMinutes: app.getState("workSessionMinutes"),
        countdownMinutes: app.getState("workSessionMinutes"),
        countdownSeconds: 0,
        currentSession: 1,
        sessionType: "work",
        sessionTypes: ["work", "shortBreak", "longBreak"],
        isPlaying: true,
        isFinishedCountdown: false,
        oneSecondInMilliseconds: 1_000,
        hiddenIconClassName: "hidden-icon",
        audioRepeatCount: 0,
        stopAudio: true,
        audioCallback: null,
        eventNames: {
            toggleTimer: "timer-toggled",
            timeDisplayUpdate: "time-display-update",
            clearTimerInterval: "clear-timer",
            sessionTypeChange: "session-type-change",
            timerIconChange: "timer-icon-change",
            rerenderSessionsIndicators: "rerender-sessions-indicators",
            timerSliceReset: "timer-slice-reset",
            togglePlayButton: "toggle-play-button",
            renderNextSessionButton: "render-next-session-button",
            stopAudio: "stop-audio",
            createStopAudioPopup: "create-stop-audio-popup"
        }
    }
    var methods = {
        overwriteTimerMinutesAndSeconds(minutes, seconds) {
            localState.countdownSeconds = seconds
            return localState.countdownMinutes = minutes
        },
        isNextSessionLongBreak() {
            return localState.currentSession === app.getState("sessionsUntilLongBreak")
        },
        nextSessionName() {
            var isNextSessionLongBreak = localState.currentSession === app.getState("sessionsUntilLongBreak") &&
                localState.sessionType === localState.sessionTypes[0]
            if (isNextSessionLongBreak) {
                return localState.sessionTypes[2]
            } else if (localState.sessionType === localState.sessionTypes[0]) {
                return localState.sessionTypes[1]
            } else {
                return localState.sessionTypes[0]
            }
        },
        isWorkSession(session) {
            return session === localState.sessionTypes[0]
        },
        isShortBreakSession(session) {
            return session === localState.sessionTypes[1]
        },
        isLongBreakSession(session) {
            return session === localState.sessionTypes[2]
        },
        replaceTimerWithNextSessionTime() {
            var nextSession = this.nextSessionName()
            var seconds = 0
            if (this.isLongBreakSession(nextSession)) {
                var minutes = app.getState("longBreakMinutes")
                methods.overwriteTimerMinutesAndSeconds(minutes, seconds)
                localState.originalCountdownMinutes = minutes
            } else if (this.isShortBreakSession(nextSession)) {
                var minutes = app.getState("breakSessionMinutes")
                methods.overwriteTimerMinutesAndSeconds(minutes, seconds)
                localState.originalCountdownMinutes = minutes
            } else {
                var minutes = app.getState("workSessionMinutes")
                methods.overwriteTimerMinutesAndSeconds(app.getState("workSessionMinutes"), seconds)
                localState.originalCountdownMinutes = minutes
            }
            localState.sessionType = nextSession
        },
        nextSessionIsLastSession() {
            return localState.currentSession === app.getState("sessionsUntilLongBreak")
        },
        rerenderSessionsIndicators() {
            return createViewEvent(localState.eventNames.rerenderSessionsIndicators)
        },
        createViewEvent(eventName) {
            return createViewEvent(eventName)
        },
        pushToHome() {
            return app.globalMethods.createWindowEvent(routerEvents.toHome)
        }
    }
    var componentRenderFunctions = {
        createSessionsIndicatorContainer: function(app, view, parentState) {
            var sessionsIndicatorContainer = app.globalMethods.createDOMElement("div", "sessions-indicator-container")
            for (var i = 0; i < app.getState("sessionsUntilLongBreak"); i++) {
                var extraClasses = i === 0 ? " active" : ""
                var sessionIndicator = app.globalMethods.createDOMElement("div", "session-indicator" + extraClasses)
                sessionsIndicatorContainer.appendChild(sessionIndicator)
            }
        
            view.addEventListener(parentState.eventNames.rerenderSessionsIndicators, function() {
                var children = sessionsIndicatorContainer.children
                for (var i = 0; i < children.length; i++) {
                    var child = children[i]
                    child.className = "session-indicator"
                    if (parentState.currentSession === i + 1) {
                        child.classList.toggle("active")
                        continue
                    }
                    if (parentState.currentSession > i + 1) {
                        child.classList.toggle("finished")
                    }
                }
            })
        
            return sessionsIndicatorContainer
        },
        createCountdownTimerContainer: function(parentState, view, parentMethods, app) {
            var methods = {
                addZeroToIntIfUnderTen(int) {
                    var stringified = int.toString()
                    return int < 10 ? "0" + stringified : stringified
                },
                stringifiedMinutes() {
                    return this.addZeroToIntIfUnderTen(parentState.countdownMinutes)
                },
                stringifiedSeconds() {
                    return this.addZeroToIntIfUnderTen(parentState.countdownSeconds)
                },
                currentTimingDisplay() {
                    return this.stringifiedMinutes() + ":" + this.stringifiedSeconds()
                },
                targetIconName() {
                    var currentSession = parentState.sessionType
                    if (parentMethods.isWorkSession(currentSession)) {
                        return "fa-briefcase"
                    } else if (parentMethods.isLongBreakSession(currentSession)) {
                        return "fa-bed"
                    } else {
                        return "fa-coffee"
                    }
                },
                targetBackgroundColor() {
                    var currentSession = parentState.sessionType
                    if (parentMethods.nextSessionIsLastSession() && !parentMethods.isLongBreakSession(parentState.sessionType)) {
                        return "yellow"
                    } else if (parentMethods.isWorkSession(currentSession)) {
                        return "green"
                    } else {
                        return "red"
                    }
                },
                targetSliceColor() {
                    var currentSession = parentState.sessionType
                    if (parentMethods.isLongBreakSession(currentSession)) {
                        return "yellow"
                    } else if (parentMethods.isWorkSession(currentSession)) {
                        return "red"
                    } else {
                        return "green"
                    }
                }
            }
        
            var countdownTimerContainer = app.globalMethods.createDOMElement("div", "countdown-timer-container green")
        
            var countdownSlicesContainer = app.globalMethods.createDOMElement("div", "countdown-slices-container")
            
            var rightCountdownSliceContainer = app.globalMethods.createDOMElement("div", "countdown-slice-container right")
            var rightCountdownSlice = app.globalMethods.createDOMElement("div", "countdown-slice right")
            rightCountdownSliceContainer.appendChild(rightCountdownSlice)
        
            var leftCountdownSliceContainer = app.globalMethods.createDOMElement("div", "countdown-slice-container")
            var leftCountdownSlice = app.globalMethods.createDOMElement("div", "countdown-slice")
            leftCountdownSliceContainer.appendChild(leftCountdownSlice)
        
            countdownSlicesContainer.appendChild(leftCountdownSliceContainer)
            countdownSlicesContainer.appendChild(rightCountdownSliceContainer)
        
            var countdownTimerTextContainer = app.globalMethods.createDOMElement("div", "countdown-text-display-container")
            var countdownTimerText = app.globalMethods.createDOMElement("div", "countdown-text-display")
            
            var textContainer = window.document.createElement("div")
            textContainer.innerText = methods.currentTimingDisplay()
            
            var countdownIconContainer = window.document.createElement("div")
            var workSessionIcon = app.globalMethods.createIcon("fas fa-briefcase")
            var breakSessionIcon = app.globalMethods.createIcon("fas fa-coffee", parentState.hiddenIconClassName)
            var longBreakIcon = app.globalMethods.createIcon("fas fa-bed", parentState.hiddenIconClassName)
        
            countdownIconContainer.appendChild(workSessionIcon)
            countdownIconContainer.appendChild(breakSessionIcon)
            countdownIconContainer.appendChild(longBreakIcon)
            
            countdownTimerText.appendChild(textContainer)
            countdownTimerText.appendChild(countdownIconContainer) 
        
            countdownTimerTextContainer.appendChild(countdownTimerText)
        
            countdownTimerContainer.appendChild(countdownSlicesContainer)
            countdownTimerContainer.appendChild(countdownTimerTextContainer)
        
            view.addEventListener(parentState.eventNames.timeDisplayUpdate, function() {
                var time = methods.currentTimingDisplay()
                textContainer.innerText = time
                return document.title = "(" + time + ") " + app.getTitle()
            })
            view.addEventListener(parentState.eventNames.timerIconChange, function() {
                var targetIcon = methods.targetIconName()
                countdownTimerContainer.className = "countdown-timer-container " + methods.targetBackgroundColor() 
                for (var icon of [workSessionIcon, breakSessionIcon, longBreakIcon]) {
                    var isTargetIcon = icon.classList.contains(targetIcon)
                    if (isTargetIcon) {
                        icon.classList.toggle(parentState.hiddenIconClassName)
                    } else if (!icon.classList.contains(parentState.hiddenIconClassName)) {
                        icon.classList.toggle(parentState.hiddenIconClassName)
                    }
                }
            })
            view.addEventListener(parentState.eventNames.timeDisplayUpdate, function() {
                var minuteToSecondsFactor = 60
                // original time seconds is always zero so no need to add seconds to original time
                var originalTime = parentState.originalCountdownMinutes * minuteToSecondsFactor
                var currentTime = parentState.countdownMinutes * minuteToSecondsFactor + parentState.countdownSeconds
                var to4DigitsAfterDecimal = 10_000
                var elapsedTimePercentage = 1 - Math.ceil((currentTime/originalTime) * to4DigitsAfterDecimal)/ to4DigitsAfterDecimal
        
                var fiftyPercent = 0.4_999
                var oneHundredPercent = 0.9_999
                var totalDegreesOfRotation = 360
                var startPosition = "rotate(0deg)"
                if (elapsedTimePercentage < fiftyPercent) {
                    rightCountdownSliceContainer.style.transform = "rotate(" + elapsedTimePercentage * totalDegreesOfRotation + "deg)" 
                } else if (elapsedTimePercentage > fiftyPercent && elapsedTimePercentage < oneHundredPercent) {
                    rightCountdownSliceContainer.style.transform = startPosition
                    rightCountdownSlice.className = "countdown-slice right " + methods.targetBackgroundColor()
                    leftCountdownSliceContainer.style.transform = "rotate(" + (elapsedTimePercentage - 0.5) * totalDegreesOfRotation + "deg)" 
                } else {
                    rightCountdownSliceContainer.style.transform = startPosition
                    leftCountdownSliceContainer.style.transform = startPosition
                    leftCountdownSlice.className = "countdown-slice " + methods.targetBackgroundColor()
                }
            })
            view.addEventListener(parentState.eventNames.timerSliceReset, function() {
                rightCountdownSliceContainer.style.transform = "rotate(0deg)"
                leftCountdownSliceContainer.style.transform = "rotate(0deg)"
                leftCountdownSlice.className = "countdown-slice " + methods.targetSliceColor()
                rightCountdownSlice.className = "countdown-slice right " + methods.targetSliceColor()
            })
        
            return countdownTimerContainer
        },
        createCountdownControlsContainer: function(parentState, view, parentMethods, app) {
            var methods = {
                nextSessionButtonColor() {
                    if (
                        parentState.currentSession === app.getState("sessionsUntilLongBreak") - 1 && 
                        parentMethods.isShortBreakSession(parentState.sessionType)
                    ) {
                        return "yellow"
                    } else if (
                        parentMethods.nextSessionName() === parentState.sessionTypes[1] || 
                        (parentMethods.isNextSessionLongBreak() && !parentMethods.isLongBreakSession(parentState.sessionType))
                    ) {
                        return "red"
                    } else {
                        return "green"
                    }
                },
                nextSessionButtonIconName() {
                    var suffix = ""
                    if (
                        parentState.currentSession === app.getState("sessionsUntilLongBreak") - 1 && 
                        parentMethods.isShortBreakSession(parentState.sessionType)
                    ) {
                        suffix = "bed"
                    } else if (
                        parentMethods.nextSessionName() === parentState.sessionTypes[1] || 
                        (parentMethods.isNextSessionLongBreak() && !parentMethods.isLongBreakSession(parentState.sessionType))
                    ) {
                        suffix = "briefcase"
                    } else {
                        suffix = "coffee"
                    }
                    var baseName = "fa-"
                    return baseName + suffix
                },
                recreateNextSessionButton(nextSessionButton, sessionIcons) {
                    var backgroundColor = this.nextSessionButtonColor()
                    var iconName = this.nextSessionButtonIconName()
                    nextSessionButton.className = "countdown-control-button " + backgroundColor
                    for (var icon of sessionIcons) {
                        var isTargetIcon = icon.classList.contains(iconName)
                        if (isTargetIcon) {
                            icon.classList.toggle(parentState.hiddenIconClassName)
                        } else if (!icon.classList.contains(parentState.hiddenIconClassName)) {
                            icon.classList.toggle(parentState.hiddenIconClassName)
                        }
                    }
                    return nextSessionButton.appendChild(icon)
                }
            }
            var countdownControlsContainer = app.globalMethods.createDOMElement("div", "countdown-controls-container")
        
            var playPauseButtonContainer = app.globalMethods.createDOMElement("div", "countdown-control-container")
            var playPauseButton = app.globalMethods.createDOMElement("button", "countdown-control-button")
            var playIcon = app.globalMethods.createIcon("fas fa-play", parentState.hiddenIconClassName)
            var pauseIcon = app.globalMethods.createIcon("fas fa-pause")
            playPauseButton.onclick = function() {
                playIcon.classList.toggle(parentState.hiddenIconClassName)
                pauseIcon.classList.toggle(parentState.hiddenIconClassName)
                parentMethods.createViewEvent(parentState.eventNames.toggleTimer)
                return parentMethods.createViewEvent(parentState.eventNames.stopAudio)
            }
            playPauseButton.appendChild(playIcon)
            playPauseButton.appendChild(pauseIcon)
            playPauseButtonContainer.appendChild(playPauseButton)
        
            var nextSessionButtonContainer = app.globalMethods.createDOMElement("div", "countdown-control-container")
            var nextSessionButton = app.globalMethods.createDOMElement("button", "countdown-control-button green")
            var shortBreakIcon = app.globalMethods.createIcon("fas fa-coffee")
            var longBreakIcon = app.globalMethods.createIcon("fas fa-bed", parentState.hiddenIconClassName)
            var workIcon = app.globalMethods.createIcon("fas fa-briefcase", parentState.hiddenIconClassName)
            
            nextSessionButton.appendChild(shortBreakIcon)
            nextSessionButton.appendChild(longBreakIcon)
            nextSessionButton.appendChild(workIcon)
            nextSessionButtonContainer.appendChild(nextSessionButton)
            
            nextSessionButton.onclick = function() {
                parentMethods.createViewEvent(parentState.eventNames.stopAudio)
                methods.recreateNextSessionButton(nextSessionButton, [shortBreakIcon, longBreakIcon, workIcon])
                return parentMethods.createViewEvent(parentState.eventNames.sessionTypeChange)
            }
        
            view.addEventListener(parentState.eventNames.togglePlayButton, function() {
                playIcon.classList.toggle(parentState.hiddenIconClassName)
                pauseIcon.classList.toggle(parentState.hiddenIconClassName)
            })
            view.addEventListener(parentState.eventNames.renderNextSessionButton, function() {
                return methods.recreateNextSessionButton(nextSessionButton, [shortBreakIcon, longBreakIcon, workIcon])
            })
        
            countdownControlsContainer.appendChild(playPauseButtonContainer)
            countdownControlsContainer.appendChild(nextSessionButtonContainer)
            return countdownControlsContainer
        },
        createBackToHomeContainer: function(parentState, app, parentMethods) {
            var backToHomeButtonContainer = app.globalMethods.createDOMElement("div", "back-to-home-button-container")
            var backToHomeButton = app.globalMethods.createDOMElement("button", "back-to-home-button")
            backToHomeButton.onclick = function() {
                parentMethods.createViewEvent(parentState.eventNames.clearTimerInterval)
                parentMethods.createViewEvent(parentState.eventNames.stopAudio)
                document.title = app.getTitle()
                return parentMethods.pushToHome()
            }
            var backToHomeIcon = app.globalMethods.createIcon("fas fa-cog")
            backToHomeButton.appendChild(backToHomeIcon)
            backToHomeButtonContainer.appendChild(backToHomeButton)
        
            return backToHomeButtonContainer
        },
        createTimerAudio: function() {
            var timerAudio = window.document.createElement("audio")
            timerAudio.src = "timer.mp3"
            return timerAudio
        }
    }

    var sessionsIndicatorContainer = componentRenderFunctions 
        .createSessionsIndicatorContainer(app, view, localState)
        
    var countdownTimerContainer = componentRenderFunctions
        .createCountdownTimerContainer(localState, view, methods, app)
        
    var countdownControlsContainer = componentRenderFunctions
        .createCountdownControlsContainer(localState, view, methods, app)
    
    var backToHomeButtonContainer = componentRenderFunctions
        .createBackToHomeContainer(localState, app, methods)

    var timerAudio = componentRenderFunctions.createTimerAudio()

    var countdownMutator = window.setInterval(function() {
        if (!localState.isPlaying || localState.isFinishedCountdown) {
            return
        }
        var seconds = localState.countdownSeconds
        var minutes = localState.countdownMinutes
        if (seconds < 1 && minutes > 0) {
            seconds = 59
            minutes = minutes - 1
        } else if (seconds < 1 && minutes < 1) {
            methods.createViewEvent(localState.eventNames.renderNextSessionButton)
            methods.createViewEvent(localState.eventNames.sessionTypeChange)
            methods.createViewEvent(localState.eventNames.togglePlayButton)
            localState.isPlaying = false
            methods.createViewEvent(localState.eventNames.timeDisplayUpdate)
            methods.createViewEvent(localState.eventNames.createStopAudioPopup)
            var audioTimeSpanInMilliseconds = 8_000
            var delayBetweenAudioInMilliseconds = 10_000
            return localState.audioCallback = window.setInterval(function() {
                    timerAudio.pause()
                    if (localState.audioRepeatCount > 2) {
                        window.clearInterval(localState.audioCallback)
                        return methods.createViewEvent(localState.eventNames.stopAudio)
                    }
                    timerAudio.currentTime = 0
                    timerAudio.play()
                    localState.audioRepeatCount++
            }, audioTimeSpanInMilliseconds + delayBetweenAudioInMilliseconds)
        } else {
            seconds = seconds - 1
        }
        methods.overwriteTimerMinutesAndSeconds(minutes, seconds)
        return methods.createViewEvent(localState.eventNames.timeDisplayUpdate)
    }, localState.oneSecondInMilliseconds)

    view.addEventListener(localState.eventNames.toggleTimer, function() {
        localState.isPlaying = !localState.isPlaying
    })
    view.addEventListener(localState.eventNames.clearTimerInterval, function() {
        return window.clearInterval(countdownMutator)
    })
    view.addEventListener(localState.eventNames.sessionTypeChange, function() {
        if (methods.isShortBreakSession(localState.sessionType)) {
            localState.currentSession += 1
            methods.rerenderSessionsIndicators()
        } else if (methods.isLongBreakSession(localState.sessionType)) {
            localState.currentSession = 1
            methods.rerenderSessionsIndicators()
        }
        methods.replaceTimerWithNextSessionTime()
        methods.createViewEvent(localState.eventNames.timerIconChange)
        return methods.createViewEvent(localState.eventNames.timerSliceReset)
    })
    view.addEventListener(localState.eventNames.stopAudio, function() {
        if (localState.audioCallback) {
            window.clearInterval(localState.audioCallback)
        }
        timerAudio.pause()
        timerAudio.currentTime = 0
        localState.audioRepeatCount = 0
    })
    view.addEventListener(localState.eventNames.createStopAudioPopup, function() {
        var stopAudioPopupContainerLayer = app.globalMethods.createDOMElement("div", "stop-audio-popup-container-layer")
        var stopAudioPopupContainer = app.globalMethods.createDOMElement("div", "stop-audio-popup-container")
        var text = "Session Finished"
        var stopAudioText = window.document.createElement("div")
        stopAudioText.innerText = text
        var clockIcon = app.globalMethods.createIcon("fa fa-clock", "stop-audio-icon")
        var stopAudioButton = app.globalMethods.createDOMElement("button", "stop-audio-button")
        stopAudioButton.innerText = "Okay"
        stopAudioButton.onclick = function() {
            stopAudioPopupContainerLayer.remove()
            return methods.createViewEvent(localState.eventNames.stopAudio)
        }

        stopAudioPopupContainer.appendChild(clockIcon)
        stopAudioPopupContainer.appendChild(stopAudioText)
        stopAudioPopupContainer.appendChild(stopAudioButton)
        stopAudioPopupContainerLayer.appendChild(stopAudioPopupContainer)
        view.appendChild(stopAudioPopupContainerLayer)
        document.title = text
    })

    return [
        sessionsIndicatorContainer,
        backToHomeButtonContainer,
        countdownTimerContainer, 
        countdownControlsContainer,
        timerAudio
    ]
}

// App setup
var app = createApp()
app.setupColorScheme()
window.document.title = app.getTitle()
app.renderFooter()

var routes = {
    "/": {
        render: homeRender
    },
    "/timer": {
        render: timerRender
    },
    // 404 not found
    "*": {
        render: function(app, view, _, routerEvents) {
            var textContainer = app.globalMethods.createDOMElement("div", "not-found-text" + app.globalMethods.addDarkModeClass())
            textContainer.innerText = "Page Not Found"
            var icon = app.globalMethods.createIcon("fa fa-history", "not-found-icon")
            
            var container = window.document.createElement("div")
            container.appendChild(icon)

            var button = app.globalMethods.createDOMElement("button", "not-found-button")
            button.innerText = "Back to Home"
            button.onclick = function() {
                return app.globalMethods.createWindowEvent(routerEvents.toHome)
            }

            return [
                textContainer, 
                container, 
                button
            ]
        }
    }
}

var router = createRouter(routes, app)

// routing listeners

// render landing page
window.addEventListener("load", router.renderRoute)
// register router change
window.addEventListener(router.eventNames.routeChange, router.renderRoute)
// if navigation history is changed via back or forward buttons
window.addEventListener("popstate", function() { 
    app.clearAllChildren()
    return router.renderRoute()
})

// individual route builders
window.addEventListener(router.eventNames.toTimer, function() {
    return router.pushToRoute("/timer")
})
window.addEventListener(router.eventNames.toHome, function() {
    return router.pushToRoute("/")
})