$(document).ready(function() {
    var today = new Date().toISOString().split('T')[0];
    $('#date').prop('min', today);
});