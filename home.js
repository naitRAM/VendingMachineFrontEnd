const rowIds = ['#topItems', '#middleItems', '#bottomItems'];
const coinToValue = { 'quarters': 0.25, 'dimes': 0.10, 'nickels': 0.05, 'pennies': 0.01 };
const itemsPerRow = 3;

function createItemCard(item) {
    let itemCard = '<div class="col-sm-4">' + '<div class="card vendItem">' + '<div class="card-body">'
        + '<p class="card-text text-left no-bottom-margin id">' + item.id + '</p>'
        + '<p class="card-text text-center name">' + item.name + '</p>'
        + '<p class="card-text text-center price">' + '$' + item.price + '</p>'
        + '<p class="card-text text-center quantity">' + 'Quantity Left: ' + item.quantity + '</p>'
        + '</div>' + '</div>' + '</div>';
    return itemCard;
}

function getInventory() {
    $.ajax({
        method: 'GET',
        contentType: 'application/json',
        url: 'http://vending.us-east-1.elasticbeanstalk.com/items',
        success: function (data, textStatus, jqXHR) {
            clearInventory();
            loadInventory(data);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log(textStatus);
        }
    });
}

function clearInputs() {
    if ($('#moneyInput').val() == '0.00') {
        $('#itemOutput').val('');
        $('#messageOutput').val('');
        $('#changeOutput').val('');
    }
}

function calculateChange() {
    let deposit = Number($('#moneyInput').val());
    let change = {};
    for (coin in coinToValue) {
        const value = coinToValue[coin];
        const coinCount = Math.floor(deposit / value);
        deposit = Math.round((deposit % value) * 100) / 100;
        if (coinCount > 0) {
            change[coin] = coinCount;
        } else {
            change[coin] = 0;
        }
    }
    return change;
}

function editInventory() {
    const moneyInput = $('#moneyInput');
    for (const coinId in coinToValue) {
        $("#" + coinId).on('click', function (e) {
            e.preventDefault();
            const amountToAdd = coinToValue[coinId];
            const money = moneyInput.val();
            clearInputs();
            const newAmount = Math.round((Number(money) + amountToAdd) * 100) / 100;
            moneyInput.val(newAmount);
        });
    }
    $('#changeButton').on('click', function (e) {
        e.preventDefault();
        clearInputs();
        showChange(calculateChange());
        $("#moneyInput").val('');
        getInventory();
    });
    $('#purchaseButton').on('click', function (e) {
        const itemOutput = $('#itemOutput');
        const itemId = itemOutput.val();
        const messageOutput = $('#messageOutput');
        const money = $('#moneyInput').val();
        e.preventDefault();
        if (!itemId) {
            messageOutput.val('Please make a selection');
        } else {
            $.ajax({
                method: 'POST',
                contentType: 'application/json',
                url: 'http://vending.us-east-1.elasticbeanstalk.com/money/' + money + '/item/' + itemId,
                success: function (change, textStatus, jqXHR) {
                    $('#moneyInput').val('');
                    messageOutput.val("Thank You!!");
                    showChange(change);
                    getInventory();
                },
                error: function (jqXHR, textStatus) {
                    const response = JSON.parse(jqXHR.responseText);
                    messageOutput.val(response.message);
                    getInventory();
                }
            })
        }
    });
}

function showChange(change) {
        $('#changeOutput').val(returnChange(change));
}

function clearInventory() {
    rowIds.forEach(function (id, index) {
        $(id).empty();
    })
}

function returnChange(changeObj) {
    let change = "";
    for (coin in changeObj) {
        if (changeObj[coin]) {
        change += coin + ": " + changeObj[coin] + '\n';
        }
    }
    return change;
}

function loadInventory(inventoryItems) {
    const rowCount = Math.ceil(inventoryItems.length / 3);
    for (let i = 0; i < rowCount; i++) {
        const rowContainer = $(rowIds[i]);
        rowContainer.append('<div class="row"></div>');
        const rowItems = inventoryItems.splice(0, itemsPerRow);
        rowItems.forEach(function (item, index) {
            const currentRow = rowContainer.find('.row');
            currentRow.append(createItemCard(item));
        });
    }
    $('.vendItem').on('click', function () {
        const itemId = $(this).find('.id').text();
        clearInputs();
        $('#itemOutput').val(itemId);
    });
    const moneyInput = $('#moneyInput');
    const money = moneyInput.val();
    if (!money) {
        moneyInput.val("0.00");
    }
}

$(document).ready(function () {
    getInventory();
    editInventory();
});