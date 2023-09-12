export default class TreeComponent {
    constructor(element, historyDataSource) {
        this.container = element;
        this.config = this.configuration();
        this.historyDataSource = historyDataSource;
    }

    async init() {
        this.historyDataSource.setCallback(this.onHistoryData.bind(this));
        await this.historyDataSource.changeVariables();
    }

    async onHistoryData(data) {
        this.container.style.scrollBehavior = 'smooth';
        const allData = this.config.topElement(data);
        if (!allData || Object.keys(allData).length === 0) {
            this.container.textContent = 'No Data. Response is empty';
            return;
        }

        const expandButton = document.createElement('button');
        expandButton.classList.add('btn', 'btn-outline-secondary', 'btn-sm', 'expand-button-tree')
        expandButton.textContent = '+';
        expandButton.addEventListener('click', this.expandAll.bind(this));

        const collapseButton = document.createElement('button');
        collapseButton.classList.add('btn', 'btn-outline-secondary', 'btn-sm', 'collapse-button-tree')
        collapseButton.textContent = '-';
        collapseButton.addEventListener('click', this.collapseAll.bind(this));
        this.chainId = this.config.chainId(data);
        const dataTree = this.buildTree(allData);
        const tree = this.createTree(dataTree, true);
        this.container.appendChild(expandButton);
        this.container.appendChild(collapseButton);

        this.container.append(tree);


        let lastScrollY = window.scrollY;
        window.addEventListener('scroll', () => {
            const containerRect = this.container.getBoundingClientRect();
            const collapseButton = this.container.querySelector('.collapse-button-tree');
            const containerTop = containerRect.top + window.scrollY + 25;
            const containerBottom = containerRect.bottom + window.scrollY - collapseButton.offsetHeight;
            const proposedPosition = window.scrollY + (window.innerHeight / 2);
            let newPosition = proposedPosition;

            if (newPosition < containerTop) {
                newPosition = containerTop;
            } else if (newPosition > containerBottom) {
                newPosition = containerBottom;
            }

            if (lastScrollY > window.scrollY) {
                if (newPosition < containerTop + 100) {
                    newPosition = containerTop + 100;
                }
            }
            lastScrollY = window.scrollY;
            if (collapseButton) {
                collapseButton.style.position = 'absolute';
                collapseButton.style.top = `${newPosition - containerTop}px`;
            }
        });

    }

    buildTree(evmData) {
        let tree = [];
        let lastParentNodes = {};

        evmData.Calls.forEach(call => {
            if (call && call.Call) {
                // const nodeText = `Depth:${call.Call.Depth} +++Index: ${call.Call.Index}  CallerIndex: ${call.Call.CallerIndex} ====EnterIndex: ${call.Call.EnterIndex}  ====ExitIndex: ${call.Call.ExitIndex} `;
                const newNode = {
                    // text: nodeText,
                    name: 'Call',
                    from: call.Call.From,
                    to: call.Call.To,
                    value: call.Call.Value,
                    method: call.Call.Signature.Signature,
                    methodHash: call.Call.Signature.SignatureHash,
                    returns: call.Returns,
                    callArguments: call.Arguments,
                    children: []
                };
                const parentArray = call.Call.Depth === 0 ? tree : lastParentNodes[call.Call.Depth - 1].children;
                parentArray.push(newNode);
                lastParentNodes[call.Call.Depth] = newNode;

                const eventForCall = evmData.Events
                    .sort((a, b) => a.Log.Index - b.Log.Index)
                    .filter(event => event.Log && event.Call.Index === call.Call.Index);

                eventForCall.forEach(event => {
                    // const eventNodeText = `Event:  ^^^^Call.Index: ${event.Call.Index}  +++Index: ${event.Log.Index} LogAfterCallIndex: ${event.Log.LogAfterCallIndex}   Event:   ${event.Log.Signature.Signature} ====EnterIndex: ${event.Log.EnterIndex}  ====ExitIndex: ${event.Log.ExitIndex}`;
                    const eventNode = {
                        // text: eventNodeText,
                        name: 'Event',
                        event: event.Log.Signature.Signature,
                        eventHash: event.Log.Signature.SignatureHash,
                        arguments: event.Arguments,
                        children: [],
                    };
                    parentArray.push(eventNode);
                });
            }
        });
        return tree;
    }

    createTree(data, isRoot = false, counter = 0) {
        const ul = document.createElement('ul');
        ul.className = 'ul-tree resetcss-tree';

        if (isRoot) {
            ul.id = 'tree';
        }

        data.forEach(item => {
            counter++
            const li = document.createElement('li');
            li.className = 'li-tree';
            const details = document.createElement('details');
            details.addEventListener('toggle', () => {
                this.updateCollapseButton();
            });
            const summary = document.createElement('summary');
            summary.className = 'summary-tree card mb-1';
            // summary.textContent = item.text;

            details.append(summary);
            li.append(details);
            const contentDiv = document.createElement('div');
            // contentDiv.style.border ='2px solid red'

            if (item.name === "Call") {

                const callDiv = document.createElement('div');
                callDiv.classList.add('content-tree');

                const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg")
                svgElement.classList.add("call-icon")
                svgElement.setAttribute("viewBox", "0 0 24 24")
                const pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path")
                pathElement.setAttribute("d", "M13 2H18C20.2091 2 22 3.79086 22 6V18C22 20.2091 20.2091 22 18 22H13C10.7909 22 9 20.2091 9 18V16V12.75L15.1893 12.75L13.4697 14.4697C13.1768 14.7626 13.1768 15.2374 13.4697 15.5303C13.7626 15.8232 14.2374 15.8232 14.5303 15.5303L16.8232 13.2374C17.5066 12.554 17.5066 11.446 16.8232 10.7626L14.5303 8.46967C14.2374 8.17678 13.7626 8.17678 13.4697 8.46967C13.1768 8.76256 13.1768 9.23744 13.4697 9.53033L15.1893 11.25L9 11.25V8V6C9 3.79086 10.7909 2 13 2ZM9 11.25H4C3.58579 11.25 3.25 11.5858 3.25 12C3.25 12.4142 3.58579 12.75 4 12.75H9V11.25Z")
                svgElement.appendChild(pathElement);

                callDiv.appendChild(svgElement)
                if (counter % 2 !== 0) {
                    callDiv.style.boxShadow = "inset 0 0 0 1000px rgba(0, 0, 0, 0.03)";
                }
                const method = this.config.rendering.renderMethodLink({
                    method: item.method,
                    hash: item.methodHash
                }, null, this.chainId);
                const addressFrom = this.config.rendering.renderJustAddressLink(item.from, null, this.chainId);
                const addressTo = this.config.rendering.renderJustAddressLink(item.to, null, this.chainId);
                const renderSenderRecieverIcon = this.config.rendering.renderSenderRecieverIcon();
                const block1 = document.createElement('div')
                const block2 = document.createElement('div')
                const block3 = document.createElement('div')
                block1.classList.add('text-block', 'ml-2')
                block1.appendChild(method);
                block2.appendChild(addressFrom);
                block3.appendChild(addressTo);
                callDiv.appendChild(block1)
                callDiv.appendChild(block2)
                callDiv.appendChild(renderSenderRecieverIcon);
                callDiv.appendChild(block3)
                let argumentsDiv = document.createElement('div')
                argumentsDiv.classList.add('event-tree')


                item.callArguments.forEach(element => {
                    const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg")
                    svgElement.classList.add("argument-icon")
                    svgElement.setAttribute("viewBox", "0 0 24 24")
                    const pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path")
                    pathElement.setAttribute("d", "M7 2.25C3.82436 2.25 1.25 4.82436 1.25 8V20.9194C1.25 22.3868 2.94738 23.2026 4.09322 22.2859L6.92069 20.0239C7.14233 19.8466 7.41772 19.75 7.70156 19.75H17C20.1756 19.75 22.75 17.1756 22.75 14V8C22.75 4.82436 20.1756 2.25 17 2.25H7ZM7.0498 12.2998C7.74016 12.2998 8.2998 11.7402 8.2998 11.0498C8.2998 10.3594 7.74016 9.7998 7.0498 9.7998C6.35945 9.7998 5.7998 10.3594 5.7998 11.0498C5.7998 11.7402 6.35945 12.2998 7.0498 12.2998ZM13.2998 11.0498C13.2998 11.7402 12.7402 12.2998 12.0498 12.2998C11.3594 12.2998 10.7998 11.7402 10.7998 11.0498C10.7998 10.3594 11.3594 9.7998 12.0498 9.7998C12.7402 9.7998 13.2998 10.3594 13.2998 11.0498ZM17.0498 12.2998C17.7402 12.2998 18.2998 11.7402 18.2998 11.0498C18.2998 10.3594 17.7402 9.7998 17.0498 9.7998C16.3594 9.7998 15.7998 10.3594 15.7998 11.0498C15.7998 11.7402 16.3594 12.2998 17.0498 12.2998Z")
                    svgElement.appendChild(pathElement);
                    if (element.Type === "address") {
                        const block = document.createElement('div')
                        block.classList.add('text-block', 'ml-2')
                        let argName = document.createElement('span')
                        argName.classList.add('name-tree')
                        let addressLink = this.config.rendering.renderJustAddressLink(element.Value.address, null, this.chainId)
                        argName.textContent = `${element.Name}:`
                        block.appendChild(svgElement)
                        block.appendChild(argName)
                        block.appendChild(addressLink)
                        callDiv.appendChild(block)
                    }
                    if (element.Type.startsWith('uint')) {
                        const block = document.createElement('div')
                        block.classList.add('text-block', 'ml-2')
                        let argName = document.createElement('span')
                        argName.classList.add('name-tree')
                        argName.textContent = element.Name ? `${element.Name}:` : `${element.Type}:`
                        let addressNumber = this.config.rendering.renderNumbers(element.Value.bigInteger)
                        block.appendChild(svgElement)
                        block.appendChild(argName)
                        block.appendChild(addressNumber)
                        callDiv.appendChild(block)
                    }
                    if (element.Type.startsWith('bytes')) {
                        const block = document.createElement('div')
                        block.classList.add('text-block', 'ml-2')
                        let argName = document.createElement('span')
                        argName.classList.add('name-tree')
                        argName.textContent = element.Name ? `${element.Name}:` : `${element.Type}:`

                        let valueBytes = this.config.rendering.renderBytes32(element.Value.hex)
                        block.appendChild(svgElement)
                        block.appendChild(argName)
                        block.appendChild(valueBytes)
                        callDiv.appendChild(block)

                    }
                })
                if (item.returns.length > 0) {
                    const returnContent = document.createElement('div')
                    returnContent.classList.add('d-flex')
                    returnContent.style.gap = '0 6px'
                    const returnContentText = document.createElement('div')
                    returnContent.classList.add('name-tree')
                    returnContent.textContent = 'Return:'
                    item.returns.forEach(element => {
                        if (element.Type === "address") {
                            const block = document.createElement('div')
                            block.classList.add('text-block', 'ml-2')
                            let argName = document.createElement('span')
                            argName.classList.add('name-tree')
                            let addressLink = this.config.rendering.renderJustAddressLink(element.Value.address, null, this.chainId)
                            argName.textContent = element.Name ? `${element.Name}:` : `${element.Type}:`

                            block.appendChild(argName)
                            block.appendChild(addressLink)
                            returnContent.appendChild(block)
                        }
                        if (element.Type.startsWith('uint')) {
                            const block = document.createElement('div')
                            block.classList.add('text-block', 'ml-2')

                            let argName = document.createElement('span')
                            argName.classList.add('name-tree')
                            argName.textContent = element.Name ? `${element.Name}:` : `${element.Type}:`
                            let addressNumber = this.config.rendering.renderNumbers(element.Value.bigInteger)
                            block.appendChild(argName)
                            block.appendChild(addressNumber)
                            returnContent.appendChild(block)
                        }
                        if (element.Type.startsWith('bytes')) {
                            const block = document.createElement('div')
                            block.classList.add('text-block', 'ml-2')

                            let argName = document.createElement('span')
                            argName.classList.add('name-tree')
                            argName.textContent = element.Name ? `${element.Name}:` : `${element.Type}:`
                            let valueBytes = this.config.rendering.renderBytes32(element.Value.hex)
                            block.appendChild(argName)
                            block.appendChild(valueBytes)
                            returnContent.appendChild(block)
                        }
                        if (element.Type === "bool") {
                            const block = document.createElement('div')
                            block.classList.add('text-block', 'ml-2')

                            let argName = document.createElement('span')
                            argName.classList.add('name-tree')
                            argName.textContent = element.Name ? `${element.Name}:` : `${element.Type}:`
                            let valueBytes = document.createElement('span')
                            valueBytes.textContent = element.Value.bool
                            block.appendChild(argName)
                            block.appendChild(valueBytes)
                            returnContent.appendChild(block)
                        }
                    })
                    callDiv.appendChild(returnContent)
                }
                // callDiv.appendChild(argumentsDiv);
                contentDiv.appendChild(callDiv);

            }
            if (item.name === 'Event') {
                let argumentsDiv = document.createElement('div')
                if (counter % 2 !== 0) {
                    argumentsDiv.style.boxShadow = "inset 0 0 0 1000px rgba(0, 0, 0, 0.03)";
                }
                argumentsDiv.classList.add('d-flex', 'flex-wrap', 'event-tree')
                const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg")
                svgElement.setAttribute("viewBox", "0 0 24 24")
                svgElement.classList.add("event-icon")
                const pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path")
                pathElement.setAttribute("d", "M10.9718 2.70846C11.4382 1.93348 12.5618 1.93348 13.0282 2.70847L15.3586 6.58087C15.5262 6.85928 15.7995 7.05784 16.116 7.13116L20.5191 8.15091C21.4002 8.35499 21.7474 9.42356 21.1545 10.1066L18.1918 13.5196C17.9788 13.765 17.8744 14.0863 17.9025 14.41L18.2932 18.9127C18.3714 19.8138 17.4625 20.4742 16.6296 20.1214L12.4681 18.3583C12.1689 18.2316 11.8311 18.2316 11.5319 18.3583L7.37038 20.1214C6.53754 20.4742 5.62856 19.8138 5.70677 18.9127L6.09754 14.41C6.12563 14.0863 6.02124 13.765 5.80823 13.5196L2.8455 10.1066C2.25257 9.42356 2.59977 8.35499 3.48095 8.15091L7.88397 7.13116C8.20053 7.05784 8.47383 6.85928 8.64138 6.58087L10.9718 2.70846Z")

                svgElement.appendChild(pathElement);
                argumentsDiv.appendChild(svgElement)
                const block = document.createElement('div')
                block.classList.add('text-block', 'ml-2')

                item.arguments.forEach(element => {
                    const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg")
                    svgElement.classList.add("argument-icon")
                    svgElement.setAttribute("viewBox", "0 0 24 24")
                    const pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path")
                    pathElement.setAttribute("d", "M7 2.25C3.82436 2.25 1.25 4.82436 1.25 8V20.9194C1.25 22.3868 2.94738 23.2026 4.09322 22.2859L6.92069 20.0239C7.14233 19.8466 7.41772 19.75 7.70156 19.75H17C20.1756 19.75 22.75 17.1756 22.75 14V8C22.75 4.82436 20.1756 2.25 17 2.25H7ZM7.0498 12.2998C7.74016 12.2998 8.2998 11.7402 8.2998 11.0498C8.2998 10.3594 7.74016 9.7998 7.0498 9.7998C6.35945 9.7998 5.7998 10.3594 5.7998 11.0498C5.7998 11.7402 6.35945 12.2998 7.0498 12.2998ZM13.2998 11.0498C13.2998 11.7402 12.7402 12.2998 12.0498 12.2998C11.3594 12.2998 10.7998 11.7402 10.7998 11.0498C10.7998 10.3594 11.3594 9.7998 12.0498 9.7998C12.7402 9.7998 13.2998 10.3594 13.2998 11.0498ZM17.0498 12.2998C17.7402 12.2998 18.2998 11.7402 18.2998 11.0498C18.2998 10.3594 17.7402 9.7998 17.0498 9.7998C16.3594 9.7998 15.7998 10.3594 15.7998 11.0498C15.7998 11.7402 16.3594 12.2998 17.0498 12.2998Z")
                    svgElement.appendChild(pathElement);
                    if (element.Type === "address") {
                        const block = document.createElement('div')
                        block.classList.add('text-block', 'ml-2')
                        let argName = document.createElement('div')
                        let addressLink = this.config.rendering.renderJustAddressLink(element.Value.address, null, this.chainId)
                        argName.textContent = element.Name ? `${element.Name}:` : `${element.Type}:`

                        argName.classList.add('name-tree')
                        addressLink.classList.add('value-tree')
                        block.appendChild(svgElement)

                        block.appendChild(argName)
                        block.appendChild(addressLink)
                        argumentsDiv.appendChild(block)

                    }
                    if (element.Type.startsWith('uint')) {
                        const block = document.createElement('div')
                        block.classList.add('text-block', 'ml-2')
                        let argName = document.createElement('div')
                        argName.classList.add('name-tree')
                        argName.textContent = element.Name ? `${element.Name}:` : `${element.Type}:`
                        let addressNumber = this.config.rendering.renderNumbers(element.Value.bigInteger)
                        block.appendChild(svgElement)

                        block.appendChild(argName)
                        block.appendChild(addressNumber)
                        argumentsDiv.appendChild(block)
                    }
                    if (element.Type.startsWith('bytes')) {
                        const block = document.createElement('div')
                        block.classList.add('text-block', 'ml-2')
                        let argName = document.createElement('div')
                        argName.classList.add('name-tree')

                        argName.textContent = element.Name ? `${element.Name}:` : `${element.Type}:`

                        let valueBytes = this.config.rendering.renderBytes32(element.Value.hex)
                        block.appendChild(svgElement)

                        block.appendChild(argName)
                        block.appendChild(valueBytes)
                        argumentsDiv.appendChild(block)
                    }
                })
                contentDiv.appendChild(argumentsDiv);
            }
            if (item.children && item.children.length > 0) {
                const childUl = this.createTree(item.children, false, counter);
                details.append(childUl);
            } else {
                summary.classList.add('no-children');
            }
            summary.appendChild(contentDiv)
            ul.append(li);
        });

        return ul;
    }

    expandAll() {
        const detailsElements = this.container.querySelectorAll('details');
        detailsElements.forEach((details) => {
            details.open = true;
        });
        const collapseButton = this.container.querySelector('.collapse-button-tree');
        if (collapseButton) collapseButton.style.display = 'block';
    }

    collapseAll() {
        const detailsElements = this.container.querySelectorAll('details');
        detailsElements.forEach((details) => {
            details.open = false;
        });
        const collapseButton = this.container.querySelector('.collapse-button-tree');
        if (collapseButton) collapseButton.style.display = 'none';
    }

    updateCollapseButton() {
        const detailsElements = this.container.querySelectorAll('details');
        const isOpen = Array.from(detailsElements).some(details => details.open);
        const collapseButton = this.container.querySelector('.collapse-button-tree');
        if (collapseButton) {
            collapseButton.style.display = isOpen ? 'block' : 'none';
        }
    }


}