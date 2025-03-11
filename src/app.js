App = {
    loading: false,
    contracts: {},

    load: async () => {
        console.log("Loading Web3...");
        await App.loadWeb3();
        console.log("Web3 Loaded.");
        await App.loadAccount();
        console.log("Account Loaded: ", App.account);

        await App.loadContract();
        console.log("Contract Loaded.");

        await App.render();
    },

    loadWeb3: async () => {
        console.log("Checking for Ethereum...");
        if (window.ethereum) {
            App.web3Provider = window.ethereum;
            window.web3 = new Web3(window.ethereum);
            try {
                console.log("Requesting accounts...");
                await window.ethereum.request({ method: "eth_requestAccounts" });
                console.log("Account access granted.");
            } catch (error) {
                console.error("User denied account access", error);
            }
        } else if (window.web3) {
            App.web3Provider = window.web3.currentProvider;
            window.web3 = new Web3(window.web3.currentProvider);
        } else {
            console.log("Non-Ethereum browser detected. You should install MetaMask!");
        }
    },

    loadAccount: async () => {
        try {
            console.log("Fetching accounts...");
            const accounts = await web3.eth.getAccounts();
            if (accounts.length > 0) {
                App.account = accounts[0];
                console.log("Account found: ", App.account);

                const accountElement = document.getElementById("account");
                if (accountElement) {
                    accountElement.innerText = App.account;
                } else {
                    console.error("Could not find element with id 'account'");
                }
            } else {
                console.log("No accounts found");
            }
        } catch (error) {
            console.error("Error loading accounts", error);
        }
    },

    loadContract: async () => {
        try {
            console.log("Loading contract...");
            const todoList = await $.getJSON("TodoList.json");
            console.log("Contract JSON loaded:", todoList);
            if (typeof TruffleContract === 'undefined') {
                console.error("TruffleContract is not defined!");
                return;
            }
        
            App.contracts.todoList = TruffleContract(todoList);
            App.contracts.todoList.setProvider(App.web3Provider);
        
            App.todoList = await App.contracts.todoList.deployed();
            console.log("Contract Loaded: ", App.todoList); 
        } catch (error) {
            console.error("Error loading contract", error);
        }
    },

    render: async () => {
        if (App.loading) return;

        App.setLoading(true);

        $('#account').html(App.account);

        await App.renderTasks();

        App.setLoading(false);
    },

    renderTasks: async () => {
        if (!App.todoList) {
            console.error("Contract is not loaded.");
            return;
        }

        try {
            console.log("Fetching task count...");
            const taskCount = await App.todoList.taskCount();
            console.log("Task Count:", taskCount.toNumber()); 

            const $taskTemplate = $(".taskTemplate");

            $("#taskList").empty();
            $("#completedTaskList").empty();

            for (var i = 1; i <= taskCount.toNumber(); i++) {
                console.log("Fetching task", i); 
                const task = await App.todoList.tasks(i);
                const taskId = task.id.toNumber();
                const taskContent = task.content;
                const taskCompleted = task.completed;

                console.log("Task", i, "Content:", taskContent, "Completed:", taskCompleted);

                const $newTaskTemplate = $taskTemplate.clone();
                $newTaskTemplate.find(".content").html(taskContent);
                $newTaskTemplate.find("input")
                    .prop("name", taskId)
                    .prop("checked", taskCompleted)
                    .on("click", App.toggleCompleted);

                if (taskCompleted) {
                    $("#completedTaskList").append($newTaskTemplate);
                } else {
                    $("#taskList").append($newTaskTemplate);
                }

                $newTaskTemplate.show();
            }
        } catch (error) {
            console.error("Error rendering tasks", error);
        }
    },

    createTask: async () => {
        App.setLoading(true);
        const content = $("#newTask").val();
        await App.todoList.createTask(content, { from: App.account });
        window.location.reload();
    },

    toggleCompleted: async (e) => {
        const taskId = e.target.name;
        await App.todoList.toggleCompleted(taskId, { from: App.account });
        window.location.reload();
    },

    setLoading: (boolean) => {
        App.loading = boolean;
        const loader = $('#loader');
        const content = $('#content');
        if (boolean) {
            loader.show();
            content.hide();
        } else {
            loader.hide();
            content.show();
        }
    },
};

$(() => {
    $(window).load(() => {
        App.load();
    });
});
