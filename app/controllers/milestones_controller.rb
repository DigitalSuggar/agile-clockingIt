# Handle basic CRUD functionality regarding Milestones
class MilestonesController < ApplicationController
  def new
    @milestone = Milestone.new
    @milestone.user = current_user
    @milestone.project_id = params[:project_id]
    @project_currency = @milestone.get_project_currency(params[:project_id])
    session[:redirect_rm] = params[:redirect]
  end

  def quick_new
    self.new
    @popup, @disable_title = true, true
    render :action => 'new', :layout => false
  end

  # Ajax callback from milestone popup window to create a new milestone on submitting the form
  def create
    params_milestone = params[:milestone]

    @milestone = Milestone.new(params[:milestone])
    logger.debug "Creating new milestone #{@milestone.name}"

    init_date = nil
    if !params[:milestone][:init_date].nil? && params[:milestone][:init_date].length > 0
      begin
        init_date = DateTime.strptime( params[:milestone][:init_date], current_user.date_format )
      rescue
        init_date = nil
      end
      @milestone.init_date = tz.local_to_utc(init_date.to_time + 1.day - 1.minute) if init_date
    end

    due_date = nil
    if !params[:milestone][:due_at].nil? && params[:milestone][:due_at].length > 0
      begin
        due_date = DateTime.strptime( params[:milestone][:due_at], current_user.date_format )
      rescue
        due_date = nil
      end
      @milestone.due_at = tz.local_to_utc(due_date.to_time + 1.day - 1.minute) if due_date
    end

    @milestone.company_id = current_user.company_id

    if @milestone.save
      unless request.xhr?
        flash[:notice] = _('Iteration was successfully created.')
        if session[:redirect_rm].nil?
          redirect_to session[:redirect_rm] #TODO: colocar redirect anterior
        else
          redirect_to session[:redirect_rm]
        end
      else
        render :update do |page|
          logger.debug "Milestone saved, reloading popup with 'parent.refreshMilestones(#{@milestone.project_id}, #{@milestone.id});'"
          # TODO: this could be replaced with "page[task_milestone_id].replace :partial => get_milestones
          # except that get_milestone currently returns json, not html
          page << "parent.refreshMilestones(#{@milestone.project_id}, #{@milestone.id});"
        end
      end
      Notifications::deliver_milestone_changed(current_user, @milestone, 'created', due_date) rescue nil
    else
      render :action => 'new'
    end
  end

  def edit
    @milestone = Milestone.find(params[:id], :conditions => ["company_id = ?", current_user.company_id])
    @milestone.init_date = tz.utc_to_local(@milestone.init_date) unless @milestone.init_date.nil?
    @milestone.due_at = tz.utc_to_local(@milestone.due_at) unless @milestone.due_at.nil?
    @project_currency = @milestone.get_project_currency(@milestone.project_id)
  end

  def update
    @milestone = Milestone.find(params[:id], :conditions => ["company_id = ?", current_user.company_id])

    @old = @milestone.clone

    @milestone.attributes = params[:milestone]

    init_date = nil
    if !params[:milestone][:init_date].nil? && params[:milestone][:init_date].length > 0
      begin
        init_date = DateTime.strptime( params[:milestone][:init_date], current_user.date_format )
        @milestone.init_date = tz.local_to_utc(init_date.to_time + 1.day - 1.minute)
      rescue Exception => e
        @milestone.init_date = @old.init_date
      end
    end

    due_date = nil
    if !params[:milestone][:due_at].nil? && params[:milestone][:due_at].length > 0
      begin
        due_date = DateTime.strptime( params[:milestone][:due_at], current_user.date_format )
        @milestone.due_at = tz.local_to_utc(due_date.to_time + 1.day - 1.minute)
      rescue Exception => e
        @milestone.due_at= @old.due_at
      end
    end
    if @milestone.save

      if(@old.init_date != @milestone.init_date || @old.due_at != @milestone.due_at || @old.name != @milestone.name || @old.description != @milestone.description )
        if( @old.name != @milestone.name)
          Notifications::deliver_milestone_changed(current_user, @milestone, 'renamed', @milestone.init_date, @milestone.due_at, @old.name) rescue nil
        else
          Notifications::deliver_milestone_changed(current_user, @milestone, 'updated', @milestone.init_date, @milestone.due_at) rescue nil
        end
      end

      flash[:notice] = _('Milestone was successfully updated.')
      redirect_to :controller => 'projects', :action => 'edit', :id => @milestone.project
    else
      render :action => 'edit'
    end
  end

  def destroy
    @milestone = Milestone.find(params[:id], :conditions => ["company_id = ?", current_user.company_id])
    Notifications::deliver_milestone_changed(current_user, @milestone, 'deleted', @milestone.init_date, @milestone.due_at) rescue nil
    @milestone.destroy

    redirect_from_last
  end

  def complete
    milestone = Milestone.find( params[:id], :conditions => ["project_id IN (#{current_project_ids})"])
    unless milestone.nil?
      milestone.completed_at = Time.now.utc
      milestone.save

      Notifications::deliver_milestone_changed(current_user, milestone, 'completed', milestone.due_at) rescue nil
      flash[:notice] = _("%s / %s completed.", milestone.project.name, milestone.name)
    end
    
    redirect_from_last
  end

  def revert
    milestone = Milestone.find(params[:id], :conditions => ["project_id IN (#{current_project_ids})"])
    unless milestone.nil?
      milestone.completed_at = nil
      milestone.save
      Notifications::deliver_milestone_changed(current_user, milestone, 'reverted', milestone.due_at) rescue nil
      flash[:notice] = _("%s / %s reverted.", milestone.project.name, milestone.name)
    end
    redirect_to :controller => 'activities', :action => 'list'
  end

  def list_completed
    @completed_milestones = Milestone.find(:all, :conditions => ["project_id = ? AND completed_at IS NOT NULL", params[:id]])
  end

  # Return a json formatted list of options to refresh the Milestone dropdown in tasks create/update page
  # TODO: use MilestonesController#list with json format instead of MilestonesController#get_milestone
  def get_milestones
    if params[:project_id].blank?
      render :text => "" and return
    end

    @milestones = Milestone.find(:all, :order => 'milestones.due_at, milestones.name', :conditions => ['company_id = ? AND project_id = ? AND completed_at IS NULL', current_user.company_id, params[:project_id]])
    @milestones = @milestones.map { |m| { :text => m.name.gsub(/"/,'\"'), :value => m.id.to_s  } }
    @milestones = @milestones.map { |m| m.to_json }
    @milestones = @milestones.join(", ")

    res = '{"options":[{"value":"0", "text":"' + _('[None]') + '"}'
    res << ", #{@milestones}" unless @milestones.nil? || @milestones.empty?
    res << '],'
    p = current_user.projects.find(params[:project_id]) rescue nil
    if p && current_user.can?(p, 'milestone')
      res << '"add_milestone_visible":"true"'
    else
      res << '"add_milestone_visible":"false"'
    end
    res << '}'

    render :text => "#{res}"
  end
end
