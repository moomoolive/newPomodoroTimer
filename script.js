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
        sessionsUntilLongBreak: 4
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
        getState(key) {
            return state[key] || null
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
        toggleFullPageAnimation() {
            return app.classList.toggle("animate-route")
        }
    }
}

function createWindowEvent(eventName) {
    var event = window.document.createEvent("Event")
    event.initEvent(eventName, true, true)
    return window.dispatchEvent(event)
}

function createRouter(routes, app) {
    function getRoute(pathName) {
        // "*" stands for 404 page
        return routes[pathName] || routes["*"]
    }
    function getCurrentRoute() {
        return getRoute(window.location.pathname)
    }
    
    return {
        renderRoute: function() {
            var route = getCurrentRoute()
            // injects app into every view so that it can have
            // access to the app's state (aka global state)
            // I did this to avoid mutating the "window" object
            var renderedRoute = route.render(app)
            app.append(renderedRoute)
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
                return createWindowEvent('router-change')
            }, milliseconds)
        }
    }
}

var routerEventSignature = "router-"
var routerEvents = {
    toTimer: routerEventSignature + "to-timer",
    toHome: routerEventSignature + "to-home"
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

function createSettingsHeader() {
    var settingsHeader = createDOMElement("div", "settings-header")
    var settingsText = window.document.createElement("span")
    settingsText.innerText = "Settings"
    var settingsIcon = createIcon("fas fa-sliders-h", "settings-icon")
    settingsHeader.appendChild(settingsIcon)
    settingsHeader.appendChild(settingsText)
    return settingsHeader
}

function createToTimerButton() {
    var toTimerButtonContainer = createDOMElement("div", "to-timer-button-container")
    var toTimerButton = createDOMElement("button", "to-timer-button")
    toTimerButton.onclick = function() {
        return createWindowEvent(routerEvents.toTimer)
    }
    var toTimerIcon = createIcon("fas fa-play")
    toTimerButton.appendChild(toTimerIcon)
    toTimerButtonContainer.appendChild(toTimerButton)
    return toTimerButtonContainer
}

function createOptionsDetailContainer(option) {
    var optionDetailsContainer = createDOMElement("div", "option-details-container")
    optionDetailsContainer.setAttribute("id", option.title + " setting")
    return optionDetailsContainer
}

function createIncrementButtonIcon(isDecrementing) {
    var iconSuffix = isDecrementing ? "minus" : "plus"
    var iconName = "fas fa-" + iconSuffix
    return createIcon(iconName)
}

function createButtonThatIncrements(option, number, isDecrementing) {
    var type = isDecrementing ? "decrement" : "increment"
    var CSSClass = type + "-interval"
    var button = createDOMElement("button", "interval-control-button " + CSSClass)
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
    var icon = createIncrementButtonIcon(isDecrementing)
    button.appendChild(icon)
    return button
}

function createIncrementButton(option, number) {
    return createButtonThatIncrements(option, number, false)
}

function createDecrementButton(option, number) {
    return createButtonThatIncrements(option, number, true)
}

function createSettingTitle(option, optionDetailsContainer) {
    var title = createDOMElement("div", "option-title")
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
}

function createView() {
    return createDOMElement("div", "view-container")
}

function homeRender(app) {
    var view = createView()
    var toTimerButtonContainer = createToTimerButton()
    view.appendChild(toTimerButtonContainer)

    var settingsHeader = createSettingsHeader()
    view.appendChild(settingsHeader)

    var optionsContainer = createDOMElement("div", "options-selection-container")
    view.appendChild(optionsContainer)

    // create individual setting containers
    var options = [
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
    for (var i = 0; i < options.length; i++) {
        var option = options[i]
        var rootOptionElement = createDOMElement("div", "option-container")

        var optionDetailsContainer = createOptionsDetailContainer(option)

        var title = createSettingTitle(option, optionDetailsContainer)

        var numberDiv = createDOMElement("div", "option-interval-number")

        var number = window.document.createElement("div")
        number.innerText = app.getState(option.targetStateKey).toString()

        var incrementButton = createIncrementButton(option, number)
        numberDiv.appendChild(incrementButton)
        numberDiv.appendChild(number)

        var intervalMetricDiv = createDOMElement("div", "option-interval-metric-container")

        var intervalMetric = createDOMElement("div", "option-interval-metric")
        var defaultIncrementType = "min"
        intervalMetric.innerText = option.incrementType || defaultIncrementType

        var decrementButton = createDecrementButton(option, number)

        intervalMetricDiv.appendChild(intervalMetric)
        intervalMetricDiv.appendChild(decrementButton)

        optionDetailsContainer.appendChild(numberDiv)
        optionDetailsContainer.appendChild(intervalMetricDiv)
        

        for (var childElement of [title, optionDetailsContainer]) {
            rootOptionElement.appendChild(childElement)
        }
        optionsContainer.appendChild(rootOptionElement)
    }
    return view
}

function createViewEvent(view, eventName) {
    var event = window.document.createEvent("Event")
    event.initEvent(eventName, true, true)
    return view.dispatchEvent(event)
}

function createSessionsIndicatorContainer(app, view, parentEventNames, parentState) {
    var sessionsIndicatorContainer = createDOMElement("div", "sessions-indicator-container")
    for (var i = 0; i < app.getState("sessionsUntilLongBreak"); i++) {
        var extraClasses = i === 0 ? " active" : ""
        var sessionIndicator = createDOMElement("div", "session-indicator" + extraClasses)
        sessionsIndicatorContainer.appendChild(sessionIndicator)
    }

    view.addEventListener(parentEventNames.rerenderSessionsIndicators, function() {
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
}

function createCountdownTimerContainer(parentState, view, parentEventNames, parentMethods, app) {
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

    var countdownTimerContainer = createDOMElement("div", "countdown-timer-container green")

    var countdownSlicesContainer = createDOMElement("div", "countdown-slices-container")
    
    var rightCountdownSliceContainer = createDOMElement("div", "countdown-slice-container right")
    var rightCountdownSlice = createDOMElement("div", "countdown-slice right")
    rightCountdownSliceContainer.appendChild(rightCountdownSlice)

    var leftCountdownSliceContainer = createDOMElement("div", "countdown-slice-container")
    var leftCountdownSlice = createDOMElement("div", "countdown-slice")
    leftCountdownSliceContainer.appendChild(leftCountdownSlice)

    countdownSlicesContainer.appendChild(leftCountdownSliceContainer)
    countdownSlicesContainer.appendChild(rightCountdownSliceContainer)

    var countdownTimerTextContainer = createDOMElement("div", "countdown-text-display-container")
    var countdownTimerText = createDOMElement("div", "countdown-text-display")
    
    var textContainer = window.document.createElement("div")
    textContainer.innerText = methods.currentTimingDisplay()
    
    var countdownIconContainer = window.document.createElement("div")
    var workSessionIcon = createIcon("fas fa-briefcase")
    var breakSessionIcon = createIcon("fas fa-coffee", parentState.hiddenIconClassName)
    var longBreakIcon = createIcon("fas fa-bed", parentState.hiddenIconClassName)

    countdownIconContainer.appendChild(workSessionIcon)
    countdownIconContainer.appendChild(breakSessionIcon)
    countdownIconContainer.appendChild(longBreakIcon)
    
    countdownTimerText.appendChild(textContainer)
    countdownTimerText.appendChild(countdownIconContainer) 

    countdownTimerTextContainer.appendChild(countdownTimerText)

    countdownTimerContainer.appendChild(countdownSlicesContainer)
    countdownTimerContainer.appendChild(countdownTimerTextContainer)

    view.addEventListener(parentEventNames.timeDisplayUpdate, function() {
        var time = methods.currentTimingDisplay()
        textContainer.innerText = time
        return document.title = "(" + time + ") " + app.getTitle()
    })
    view.addEventListener(parentEventNames.timerIconChange, function() {
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
    view.addEventListener(parentEventNames.timeDisplayUpdate, function() {
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
    view.addEventListener(parentEventNames.timerSliceReset, function() {
        rightCountdownSliceContainer.style.transform = "rotate(0deg)"
        leftCountdownSliceContainer.style.transform = "rotate(0deg)"
        leftCountdownSlice.className = "countdown-slice " + methods.targetSliceColor()
        rightCountdownSlice.className = "countdown-slice right " + methods.targetSliceColor()
    })

    return countdownTimerContainer
}

function createCountdownControlsContainer(parentState, view, parentEventNames, parentMethods, sessionTypes, app) {
    var methods = {
        nextSessionButtonColor() {
            if (
                parentState.currentSession === app.getState("sessionsUntilLongBreak") - 1 && 
                parentMethods.isShortBreakSession(parentState.sessionType)
            ) {
                return "yellow"
            } else if (
                parentMethods.nextSessionName() === sessionTypes[1] || 
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
                parentMethods.nextSessionName() === sessionTypes[1] || 
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
            var color = this.nextSessionButtonColor()
            var iconName = this.nextSessionButtonIconName()
            nextSessionButton.className = "countdown-control-button " + color
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
    var countdownControlsContainer = createDOMElement("div", "countdown-controls-container")

    var playPauseButtonContainer = createDOMElement("div", "countdown-control-container")
    var playPauseButton = createDOMElement("button", "countdown-control-button")
    var playIcon = createIcon("fas fa-play", parentState.hiddenIconClassName)
    var pauseIcon = createIcon("fas fa-pause")
    playPauseButton.onclick = function() {
        playIcon.classList.toggle(parentState.hiddenIconClassName)
        pauseIcon.classList.toggle(parentState.hiddenIconClassName)
        createViewEvent(view, parentEventNames.toggleTimer)
        return createViewEvent(view, parentEventNames.stopAudio)
    }
    playPauseButton.appendChild(playIcon)
    playPauseButton.appendChild(pauseIcon)
    playPauseButtonContainer.appendChild(playPauseButton)

    var nextSessionButtonContainer = createDOMElement("div", "countdown-control-container")
    var nextSessionButton = createDOMElement("button", "countdown-control-button green")
    var shortBreakIcon = createIcon("fas fa-coffee")
    var longBreakIcon = createIcon("fas fa-bed", parentState.hiddenIconClassName)
    var workIcon = createIcon("fas fa-briefcase", parentState.hiddenIconClassName)
    
    nextSessionButton.appendChild(shortBreakIcon)
    nextSessionButton.appendChild(longBreakIcon)
    nextSessionButton.appendChild(workIcon)
    nextSessionButtonContainer.appendChild(nextSessionButton)
    
    nextSessionButton.onclick = function() {
        createViewEvent(view, parentEventNames.stopAudio)
        methods.recreateNextSessionButton(nextSessionButton, [shortBreakIcon, longBreakIcon, workIcon])
        return createViewEvent(view, parentEventNames.sessionTypeChange)
    }

    view.addEventListener(parentEventNames.togglePlayButton, function() {
        playIcon.classList.toggle(parentState.hiddenIconClassName)
        pauseIcon.classList.toggle(parentState.hiddenIconClassName)
    })
    view.addEventListener(parentEventNames.renderNextSessionButton, function() {
        return methods.recreateNextSessionButton(nextSessionButton, [shortBreakIcon, longBreakIcon, workIcon])
    })

    countdownControlsContainer.appendChild(playPauseButtonContainer)
    countdownControlsContainer.appendChild(nextSessionButtonContainer)
    return countdownControlsContainer
}

function createBackToHomeContainer(view, parentEventNames, app) {
    var backToHomeButtonContainer = createDOMElement("div", "back-to-home-button-container")
    var backToHomeButton = createDOMElement("button", "back-to-home-button")
    backToHomeButton.onclick = function() {
        createViewEvent(view, parentEventNames.clearTimerInterval)
        createViewEvent(view, parentEventNames.stopAudio)
        document.title = app.getTitle()
        return toHomepageEvent()
    }
    var backToHomeIcon = createIcon("fas fa-cog")
    backToHomeButton.appendChild(backToHomeIcon)
    backToHomeButtonContainer.appendChild(backToHomeButton)

    return backToHomeButtonContainer
}

function timerRender(app) {
    var timerAudio = window.document.createElement("audio")
    timerAudio.src = "timer.mp3"

    var sessionTypes = ["work", "shortBreak", "longBreak"]
    var localState = {
        originalCountdownMinutes: app.getState("workSessionMinutes"),
        countdownMinutes: app.getState("workSessionMinutes"),
        countdownSeconds: 0,
        currentSession: 1,
        sessionType: sessionTypes[0],
        isPlaying: true,
        isFinishedCountdown: false,
        oneSecondInMilliseconds: 1_000,
        hiddenIconClassName: "hidden-icon",
        audioRepeatCount: 0
    }
    var localEventNames = {
        toggleTimer: "timer-toggled",
        timeDisplayUpdate: "time-display-update",
        clearTimerInterval: "clear-timer",
        sessionTypeChange: "session-type-change",
        timerIconChange: "timer-icon-change",
        rerenderSessionsIndicators: "rerender-sessions-indicators",
        timerSliceReset: "timer-slice-reset",
        togglePlayButton: "toggle-play-button",
        renderNextSessionButton: "render-next-session-button",
        stopAudio: "stop-audio"
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
                localState.sessionType === sessionTypes[0]
            if (isNextSessionLongBreak) {
                return sessionTypes[2]
            } else if (localState.sessionType === sessionTypes[0]) {
                return sessionTypes[1]
            } else {
                return sessionTypes[0]
            }
        },
        isWorkSession(session) {
            return session === sessionTypes[0]
        },
        isShortBreakSession(session) {
            return session === sessionTypes[1]
        },
        isLongBreakSession(session) {
            return session === sessionTypes[2]
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
            return createViewEvent(view, localEventNames.rerenderSessionsIndicators)
        }
    }
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
            createViewEvent(view, localEventNames.renderNextSessionButton)
            createViewEvent(view, localEventNames.sessionTypeChange)
            createViewEvent(view, localEventNames.togglePlayButton)
            localState.isPlaying = false
            createViewEvent(view, localEventNames.timeDisplayUpdate)
            timerAudio.play()
            localState.audioRepeatCount++
            return timerAudio.addEventListener("ended", function() {
                if (localState.audioRepeatCount > 2) {
                    return createViewEvent(view, localEventNames.stopAudio)
                }
                var delayBetweenAudioInMilliseconds = 10_000
                return window.setTimeout(function() {
                    timerAudio.currentTime = 0
                    timerAudio.play()
                    localState.audioRepeatCount++
                }, delayBetweenAudioInMilliseconds)
            })
        } else {
            seconds = seconds - 1
        }
        methods.overwriteTimerMinutesAndSeconds(minutes, seconds)
        return createViewEvent(view, localEventNames.timeDisplayUpdate)
    }, localState.oneSecondInMilliseconds)

    var view = createView()
    var sessionsIndicatorContainer = createSessionsIndicatorContainer(
        app, 
        view, 
        localEventNames,
        localState
    )
    var countdownTimerContainer = createCountdownTimerContainer(
        localState, 
        view, 
        localEventNames, 
        methods,
        app
    )
    var countdownControlsContainer = createCountdownControlsContainer(
        localState, 
        view, 
        localEventNames, 
        methods,
        sessionTypes,
        app
    )
    var backToHomeButtonContainer = createBackToHomeContainer(
        view, 
        localEventNames,
        app
    )

    view.addEventListener(localEventNames.toggleTimer, function() {
        localState.isPlaying = !localState.isPlaying
    })
    view.addEventListener(localEventNames.clearTimerInterval, function() {
        return window.clearInterval(countdownMutator)
    })
    view.addEventListener(localEventNames.sessionTypeChange, function() {
        if (methods.isShortBreakSession(localState.sessionType)) {
            localState.currentSession += 1
            methods.rerenderSessionsIndicators()
        } else if (methods.isLongBreakSession(localState.sessionType)) {
            localState.currentSession = 1
            methods.rerenderSessionsIndicators()
        }
        methods.replaceTimerWithNextSessionTime()
        createViewEvent(view, localEventNames.timerIconChange)
        return createViewEvent(view, localEventNames.timerSliceReset)
    })
    view.addEventListener(localEventNames.stopAudio, function() {
        timerAudio.pause()
        timerAudio.currentTime = 0
        localState.audioRepeatCount = 0
    })

    var viewDirectChildrenElements = [
        sessionsIndicatorContainer,
        backToHomeButtonContainer,
        countdownTimerContainer, 
        countdownControlsContainer,
        timerAudio
    ]
    for (var element of viewDirectChildrenElements) {
        view.appendChild(element)
    }

    return view
}

// App setup
var app = createApp()
window.document.title = app.getTitle()

function toHomepageEvent() {
    return createWindowEvent(routerEvents.toHome)
}

var routes = {
    "/": {
        render: homeRender
    },
    "/timer": {
        render: timerRender
    },
    // 404 not found
    "*": {
        render: function() {
            var view = createView()
            view.innerText = "Page not found"
            var icon = createIcon("fa fa-history", "not-found-icon")
            
            var container = window.document.createElement("div")
            container.appendChild(icon)
            view.appendChild(container)

            var button = createDOMElement("button", "not-found-button")
            button.innerText = "Back to Home"
            button.onclick = toHomepageEvent
            view.appendChild(button)

            return view
        }
    }
}

var router = createRouter(routes, app)

// routing listeners

// render landing page
window.addEventListener("load", router.renderRoute)
// register router change (custom event)
window.addEventListener("router-change", router.renderRoute)
// if navigation history is changed via back or forward buttons
window.addEventListener("popstate", function() { 
    app.clearAllChildren()
    return router.renderRoute()
})

// individual route builders
window.addEventListener(routerEvents.toTimer, function() {
    return router.pushToRoute("/timer")
})
window.addEventListener(routerEvents.toHome, function() {
    return router.pushToRoute("/")
})