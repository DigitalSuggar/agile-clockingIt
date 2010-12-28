jQuery.noConflict();

// -------------------------
// theming
//

jQuery(function() {
    jQuery("input:submit").button();
//jQuery("#tabmenu").tabs();
});



// -------------------------
// show progress spinner
//

function showProgress() {
    jQuery('#loading').show('fast');
}
function hideProgress() {
    jQuery('#loading').hide('fast');
}

jQuery(document).mousemove(function(e) {
    if (jQuery('#loading').is(':visible')) {
        jQuery("#loading").css({
            top: (e.pageY  - 8) + "px",
            left: (e.pageX + 10) + "px"
        });
    }
});

jQuery("#loading").bind("ajaxSend", function(){
    jQuery(this).show('fast');
}).bind("ajaxComplete", function(){
    jQuery(this).hide('fast');
});


/* this function is deprecated and subject to removal */
function inline_image(el) {
    $(el).setStyle({
        width:'auto',
        visibility:'hidden'
    });
    if (el.width > 500) {
        el.style.width = '500px';
    }
    el.style.visibility = 'visible';
}

/*
 Tooltips are setup on page load, but sometimes the page is updated
 using ajax, and the tooltips need to be setup again, so this method
 sets up tooltips in page.
*/
function updateTooltips() {
    jQuery('.tooltip').tooltip({
        showURL: false
    });
}

function UpdateDnD() {
    updateTooltips();
}

function do_update(user, url) {
    if( user != userId ) {
        jQuery.get(url);
    }
}

function rebuildSelect(select, data) {
    select.options.length = 0;
    for( var i=0; i<data.length; i++ ) {
        select.options[i] = new Option(data[i].text,data[i].value,null,false);
    }
}


function dateToWords(elem) {
    var date = elem.text();
    var text = date;
    var className = null;

    date = jQuery.datepicker.parseDate("yy-mm-dd", date);

    if (date !== null) {
        var diff = (((new Date()).getTime() - date.getTime()) / 1000);
        var dayDiff = Math.floor(diff / 86400);

        if (isNaN(dayDiff)) {
            text = date;
        }
        else if (dayDiff == -1) {
            text = "Tomorrow";
            className = "due_tomorrow";
        }
        else if (dayDiff === 0) {
            text = "Today";
            className = "due";
        }
        else if (dayDiff == 1) {
            text = "Yesterday";
            className = "due_overdue";
        }
        else if (dayDiff < 0) {
            dayDiff = Math.abs(dayDiff);
            text = dayDiff + " days";
            className = dayDiff >= 7 ? "due_distant" : "due_soon";
        }
        else if (dayDiff > 0) {
            text = dayDiff + " days ago";
            className = "due_overdue";
        }
    }

    elem.addClass(className);
    elem.text(text);
}

jQuery.fn.dateToWords = function() {
    return this.each(function() {
        dateToWords(jQuery(this));
    });
};


function addProjectToUser(event, ui) {
    var value = ui.item.id;

    var url = document.location.toString();
    url = url.replace("/edit/", "/project/");
    jQuery.get(url, {
        project_id: value
    }, function(data) {
        jQuery("#add_user").before(data);
    });

    jQuery(this).val("");
    return false;
}

function addUserToProject(event, ui) {
    var value = ui.item.id;
    var url = document.location.toString();
    url = url.replace("/edit/", "/ajax_add_permission/");
    jQuery.get(url, {
        user_id : value
    }, function(data) {
        jQuery("#user_table").html(data);
    });
    return false;
}

function addUserToProjectOnlyCompany(event,ui){
    jQuery('#project_leader_id').val(ui.item.id);
}


/*
  Requests the available attributes for the given resource type
  and updates the page with the returned values.
*/
function updateResourceAttributes(select) {
    select = jQuery(select);
    var typeId = select.val();
    var target = jQuery("#attributes");

    if (typeId == "") {
        target.html("");
    }
    else {
        var url = "/resources/attributes/?type_id=" + typeId;
        jQuery.get(url, function(data) {
            target.html(data);
        });
    }
}

/*
  Removes the resource attribute to the link
*/
function removeAttribute(link) {
    link = jQuery(link);
    link.parent(".attribute").remove();
}

/*
  Adds a new field to allow people to have multiple values
  for resource attributes.
*/
function addAttribute(link) {
    link = jQuery(link);
    var origAttribute = link.parent(".attribute");

    var newAttribute = origAttribute.clone();
    newAttribute.find(".value").val("");
    newAttribute.find("a.add_attribute").remove();
    newAttribute.find(".attr_id").remove();

    var removeLink = newAttribute.find("a.remove_attribute");
    // for some reason this onclick needs to be manually set after cloning
    removeLink.click(function() {
        removeAttribute(removeLink);
    });
    removeLink.show();

    origAttribute.after(newAttribute);
}


// I'm not sure why, but we seem to need to add these for the event
// to fire - onclick doesn't seem to work.
jQuery(document).ready(function() {
    jQuery(".remove_attribute").click(function(evt) {
        removeAttribute(evt.target);
    });
});

/*
 Shows / hides applicabel attribute fields depending on the value
 of checkbox
*/
function updateAttributeFields(checkbox) {
    checkbox = jQuery(checkbox);
    var preset = checkbox.is(":checked");

    var parent = checkbox.parents(".attribute");
    var maxLength = parent.find(".max_length");
    var choices = parent.find(".choices");
    var choiceLink = parent.find(".add_choice_link");
    var multiple = parent.find(".multiple");

    if (preset) {
        multiple.hide().find("input").attr("checked", false);
        maxLength.hide().find("input").val("");
        choices.show();
        choiceLink.show();
    }
    else {
        multiple.show();
        maxLength.show();
        choices.hide().html("");
        choiceLink.hide();
    }
}

/*
  Does a get request to the given url. The response is appended
  to any element matching selector.
  If a callback function is given, that will be called after the partial
  has been loaded and added to the page.
*/
function appendPartial(url, selector, callback) {
    jQuery.get(url, { }, function(data) {
        jQuery(selector).append(data);

        if (callback) {
            callback.call();
        }
    });
}

function appendPopup(url, selector, callback) {
    jQuery.get(url, { }, function(data) {
        var html = "<span style='display: none' id='ui_popup_dialog'>"+ data +"</span>"
        jQuery(selector).prepend(html);

        if (callback) {
            callback.call();
        }
    });
}

function updatePositionFields(listSelector) {
    var list = jQuery(listSelector);
    var children = list.children();

    for (var i = 0; i < children.length; i++) {
        var positionField = jQuery(children[i]).find(".position");
        positionField.val(i + 1);
    }
}

/*
 Adds fields to setup a new custom attribute choice.
*/
function addAttributeChoices(sender) {
    var choices = jQuery(sender).parent().find('.choices');
    var callback = function() {
        updatePositionFields(choices);
    };

    var attribute = jQuery(sender).parents(".attribute");
    var attrId = attribute.attr("id").split("_").pop();

    if (attrId == "attribute") {
        // new attribute, so just ignore
        attrId = "";
    }
    var url = "/custom_attributes/choice/" + attrId;
    appendPartial(url, choices, callback);
}

/*
  Adds the selected dependency to the task currently being edited.
  The task must be saved for the dependency to be permanently linked.
*/
function addDependencyToTask(event, ui) {
    var id = ui.item.id;
    jQuery(this).val("");
    jQuery.get("/tasks/dependency/", {
        dependency_id : id
    }, function(data) {
        jQuery("#task_dependencies .dependencies").append(data);
    });
    return false;
}
/*
  Adds the selected resource to the task currently being edited.
  The task must be saved for the resource to be permanently linked.
*/
function addResourceToTask(event, ui) {
    var id = ui.item.id;
    jQuery(this).val("");
    jQuery.get("/tasks/resource/", {
        resource_id : id
    }, function(data) {
        jQuery("#task_resources").append(data);
    });
    return false;
}
/*
  Removes the link from resource to task
*/
function removeTaskResource(link) {
    link = jQuery(link);
    var parent = link.parent(".resource_no");
    parent.remove();
}

/*
  For the resources edit page.
  Retrieves the password from the given url, and updated
  the nearest password div with the returned value.
*/
function showPassword(link, url) {
    link = jQuery(link);
    link.hide();

    var passwordDiv = link.prev(".password");
    passwordDiv.load(url);
}

/*
  Checkboxes for nested forms cause trouble in params parsing
  when index => nil. This function fixes the problem by disabling the
  form element that is not in use.
*/
function nestedCheckboxChanged(checkbox) {
    checkbox = jQuery(checkbox);
    var checked = checkbox.attr("checked");

    var hiddenField = checkbox.prev();
    if (hiddenField.attr("name") == checkbox.attr("name")) {
        hiddenField.attr("disabled", checked);
    }
}

/*
    The function nestedCheckboxChanged will fix any
    checkboxes that are changed, but this function should be called
    on page load to fix any already in the page (generally because they
    failed a validation.
*/
function fixNestedCheckboxes() {
    var checkboxes = jQuery(".nested_checkbox");
    for (var i = 0; i < checkboxes.length; i++) {
        nestedCheckboxChanged(checkboxes[i]);
    }
}

/*
 Toggles the visiblity of the element next to sender.
 Updates the text of sender to "Show" or "Hide" as appropriate.
 Pass selector as null to just hide the immediately preceding element.
*/
function togglePreviousElement(sender, selector) {
    sender = jQuery(sender);
    var toggle = sender.prev();
    if (selector) {
        toggle = jQuery(selector);
    }

    if (toggle.is(':visible')) {
        sender.text("Show");
    }
    else {
        sender.text("Hide");
    }

    toggle.toggle();
}


/*
  Toggles the approval status of the given work log
*/
function toggleWorkLogApproval(sender, workLogId) {
    var checked = jQuery(sender).attr("checked");

    jQuery.post("/tasks/update_work_log", {
        id : workLogId,
        "work_log[approved]" : checked
    });
}

function setPageTarget(event, ui) {
    var id = ui.item.id;
    var type = ui.item.type;
    jQuery("#page_notable_id").val(id);
    jQuery("#page_notable_type").val(type);
}

/*TODO: Move following code to another file
*/
/*
  Attach behavior to views/tasks/_details.html.erb,
  instead of removed helper method task_project_watchers_js
*/
function attach_behaviour_to_project_select() {
    var projectSelect = jQuery('#task_project_id');
    if(projectSelect.size()){
        projectSelect.change(function(){
            projectId=jQuery('#task_project_id option:selected').val();
            refreshMilestones(projectId,0);
            addAutoAddUsersToTask('', '', projectId);
            addClientLinkForTask(projectId);
            if (projectId == "") {
                projectId = jQuery('#task_project_id option:nth-child(2)').attr('value');
            }
            jQuery('#add_milestone a').attr('href', '/milestones/quick_new?project_id=' + projectId);
        });
    }
}
/*
  Attach behavior to views/tasks/_details.html.erb,
  instead of removed helper method task_project_watchers_js
*/
function attach_behaviour_to_milestone_select() {
    var milestoneSelect = jQuery('#task_milestone_id');
    if(milestoneSelect.size()){
        milestoneSelect.change(function(){
            milestoneId=jQuery('#task_milestone_id option:selected').val();
            addVelocityToTask(milestoneId);
            addPointsPerHourToTask(milestoneId);
        });
    }
}

//return path to tasks or task_templates controller
//based on current page path
//so we can reuse tasks code, views and javasript in taks_templates
function tasks_path(action_name) {
    if (/tasks\//.test(document.location.pathname)) {
        return "/tasks/" + action_name ;
    }
    else if ( /task_templates\//.test(document.location.pathname)) {
        return "/task_templates/" + action_name ;
    }
    else if (jQuery('#template_clone').val() == '1') {
        return "/tasks/" + action_name ;
    }
    return action_name;
}


/*
 This function adds in the selected value to the previous autocomplete.
 The autocomplete text field itself will be updated with the name, and
 a hidden field directly before the text field will be updated with the object id.
*/
function updateAutoCompleteField(event, ui) {
    jQuery("#resource_customer_id").val(ui.item.id);
}

jQuery(document).ready(function() {
    fixNestedCheckboxes();

    highlightWatchers();
    init_task_form();

    jQuery(function() {
        jQuery('#target').catcomplete({
            source: '/pages/target_list',
            select: setPageTarget,
            delay: 800,
            minLength: 1
        });
    });
    autocomplete('#resource_customer_name', '/users/auto_complete_for_customer_name', updateAutoCompleteField);
    autocomplete('#project_customer_name', '/application/auto_complete_for_customer_name', addCustomerToProject);
    autocomplete('#user_project_name_autocomplete', '/users/auto_complete_for_project_name', addProjectToUser);
    autocomplete('#project_user_name_autocomplete', '/application/auto_complete_for_user_name', addUserToProject);
    autocomplete('#auto_complete_for_user_name_only_company','/application/auto_complete_for_user_name_only_company',addUserToProjectOnlyCompany);

    jQuery(".datefield").datepicker({
        constrainInput: false,
        dateFormat: userDateFormat
    });
});

function toggleAccess() {
    if (jQuery('#accessLevel_container div').hasClass('private')) {
        jQuery('#accessLevel_container div').removeClass('private');
        jQuery('#work_log_access_level_id').val('1');
    } else {
        jQuery('#accessLevel_container div').addClass('private');
        jQuery('#work_log_access_level_id').val('2');
    }
    highlightWatchers();
}



function autocomplete(input_field, path, after_callback) {
    jQuery(input_field).autocomplete({
        source: path,
        select: after_callback,
        delay: 800,
        minLength: 3
    });
}

jQuery.widget("custom.catcomplete", jQuery.ui.autocomplete, {
    _renderMenu: function( ul, items ) {
        var self = this,
        currentCategory = "";
        jQuery.each( items, function( index, item ) {
            if ( item.category != currentCategory ) {
                ul.append( "<li class='ui-autocomplete-category'>" + item.category + "</li>" );
                currentCategory = item.category;
            }
            self._renderItem( ul, item );
        });
    }
});




function autocomplete_multiple_remote(input_field, path){
    jQuery(function(){
        function split(val) {
            return val.split(/,\s*/);
        }
        function extractLast(term) {
            return split(term).pop();
        }
        jQuery(input_field).autocomplete({
            source: function(request, response) {
                jQuery.getJSON(path, {
                    term: extractLast(request.term)
                }, response);
            },
            search: function() {
                var term = extractLast(this.value);
                if (term.length < 2) {
                    return false;
                }
            },
            focus: function() {
                return false;
            },
            select: function(event, ui) {
                var terms = split( this.value );
                terms.pop();
                terms.push( ui.item.value );
                terms.push("");
                this.value = terms.join(", ");
                return false;
            }

        });

    });

}


/* Events */
jQuery('#flash_message').click(function(){
    jQuery('#flash').remove();
});

jQuery('#worklog_body').blur(function(){
    jQuery.ajax({
        'url': '/tasks/updatelog',
        'data': jQuery('#worklog_form').serialize(),
        'dataType': 'text',
        'type': 'POST',
        'success': function(data){
            jQuery('#worklog-saved').html(data) ;
        }
    });
});

function mark_as_default(sender) {
    jQuery("label[for=user_email]").text("");
    jQuery(sender).parent().siblings("label").text("Email");
    jQuery("span#user_email_addresses span input[type=hidden]").val("");
    jQuery(sender).parent().siblings("input[type=hidden]").attr("value","1");
    jQuery("span#user_email_addresses span b").replaceWith("<span class='email_link_actions'><a class='action_email' href='#' onclick='mark_as_default(this); return false;'>Mark As Default</a><a class='action_email' href='#' onclick='jQuery(this).parent().parent().remove(); return false;'>Remove</a></span>");
    jQuery(sender).parent().parent().prependTo("span#user_email_addresses");
    jQuery(sender).parent().replaceWith("<b>Default</b>");
}

function reload_roadmap(sender){
    window.location = "/roadmap/index?id=" + sender;
}

function reload_estimation_settings(sender) {
    window.location ="/estimation_settings/edit?project_id=" + sender
}

function copyDateTime(dateTime){
    jQuery("#copiedDateTime").val(dateTime)
}