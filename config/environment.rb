# Be sure to restart your web server when you modify this file.

# Uncomment below to force Rails into production mode when
# you don't control web/app server and can't set it the proper way
# ENV['RAILS_ENV'] ||= 'production'

# Specifies gem version of Rails to use when vendor/rails is not present
RAILS_GEM_VERSION = '2.3.8' unless defined? RAILS_GEM_VERSION

# Bootstrap the Rails environment, frameworks, and default configuration
require File.join(File.dirname(__FILE__), 'boot')
require File.join(File.dirname(__FILE__), '../lib/localization.rb')
Localization.load

JAVA = RUBY_PLATFORM =~ /java/

if JAVA
  require 'rubygems'
  gem 'activerecord-jdbc-adapter'
  require 'jdbc_adapter'
end

Rails::Initializer.run do |config|
  # Settings in config/environments/* take precedence over those specified here.
  # Application configuration should go into files in config/initializers
  # -- all .rb files in that directory are automatically loaded.

  # Add additional load paths for your own custom dirs
   config.load_paths += %W( #{Rails.root}/app/sweepers )

  # Enable page/fragment caching by setting a file-based store
  # (remember to create the caching directory and make it readable to the application)
  config.action_controller.cache_store = :file_store, "#{RAILS_ROOT}/tmp/cache"

  # Activate observers that should always be running
  # config.active_record.observers = :cacher, :garbage_collector
  config.active_record.observers = :tag_sweeper
  # Set Time.zone default to the specified zone and make Active Record auto-convert to this zone.
  # Run "rake -D time" for a list of tasks for finding time zone names.
  config.time_zone = 'UTC'

  # The default locale is :en and all translations from config/locales/*.rb,yml are auto loaded.
  # config.i18n.load_path += Dir[Rails.root.join('my', 'locales', '*.{rb,yml}')]
  # config.i18n.default_locale = :de

  # Rotate logs when they reach 50Mb and keep 5 old logs
  config.logger = Logger.new(config.log_path, 5, 50*1024*1024)
  config.gem 'erubis'
  config.gem 'splattael-activerecord_base_without_table', :lib => 'activerecord_base_without_table', :source => 'http://gems.github.com'
  config.gem 'daemons', :version => '1.1.0'
  config.gem 'eventmachine'
  config.gem 'will_paginate', :version => '2.3.14'
  config.gem 'icalendar', :version => '1.1.5'
  config.gem 'tzinfo'
  config.gem 'abstract'
  config.gem 'RedCloth', :version => '4.2.3'
  config.gem 'gchartrb', :version => '0.8', :lib => 'google_chart'
  config.gem 'smurf', :version => '1.0.4'
  config.gem 'paperclip', :version => '2.3.3'
  config.gem 'acts_as_tree'
  config.gem 'acts_as_list'

  if !JAVA
    config.gem 'mysql2', :version => '>= 0.2.3'
    config.gem 'json'
  end

  if RUBY_VERSION < "1.9"
    # fastercsv has been moved in as default csv engine in 1.9
    config.gem 'fastercsv', :version => '>=1.5.0'
  else
    require "csv"
    if !defined?(FasterCSV)
      class Object
        FasterCSV = CSV
        alias_method :FasterCSV, :CSV
      end
    end
  end

  # CUSTOM GEMS
  # Any gem files which aren't needed for the system to work, but may
  # be required for your own development should be in this file:
  custom_gems_file = "#{Rails.root}/config/custom.gems.rb"
  load custom_gems_file if File.exist?(custom_gems_file)
  load_custom_gems(config) if respond_to?(:load_custom_gems)
end

#
# Add new inflection rules using the following format
# (all these examples are active by default):
# Inflector.inflections do |inflect|
#   inflect.plural /^(ox)$/i, '\1en'
#   inflect.singular /^(ox)en/i, '\1'
#   inflect.irregular 'person', 'people'
#   inflect.uncountable %w( fish sheep )
# end

require File.join(File.dirname(__FILE__), '../lib/rails_extensions')

local_env = File.join(File.dirname(__FILE__), 'environment.local.rb')
load(local_env) if File.exists?(local_env)

require File.join(File.dirname(__FILE__), '../lib/misc.rb')

require_dependency 'tzinfo'
include TZInfo


# Trying out seeding the db here, rather than in migrations or seeds.rb
# to try to help out with easier deployment
begin
  TimeRange.create_defaults if TimeRange.count != TimeRange::DEFAULTS.length
rescue
#  puts $!
end

# If a value is set for ENV[env_name], sets hash[name]
# to that value. If not, leaves hash[name] untouched
def load_from_env(env_name, name, hash, &block)
  if ENV[env_name].present?
    if block_given?
      hash[name] = yield(ENV[env_name])
    else
      hash[name] = ENV[env_name]
    end
  end
end



require "pp"

# Load any action mailer settings from ENV
ActionMailer::Base.smtp_settings ||= {}
load_from_env("SMTP_HOSTNAME", :address, ActionMailer::Base.smtp_settings)
load_from_env("SMTP_PORT", :port, ActionMailer::Base.smtp_settings) { |p| p.to_i }
load_from_env("SMTP_DOMAIN", :domain, ActionMailer::Base.smtp_settings)
load_from_env("SMTP_USER", :user_name, ActionMailer::Base.smtp_settings)
load_from_env("SMTP_PASSWORD", :password, ActionMailer::Base.smtp_settings)
load_from_env("SMTP_AUTHENTICATION", :authentication, ActionMailer::Base.smtp_settings)

# puts "ActionMailer Settings:"
# pp ActionMailer::Base.smtp_settings
# puts "\n"

# Load any $CONFIG settings from ENV
$CONFIG = {
	:domain => "mail.cantv.net",  # The client specific hostname will be prepended to this domain
	:email_domain => "aclocking.com",
	:replyto => "admin",  # Note that this is not a full email address, just the part before the @
	:from => "admin",  # Note that this is not a full email address, just the part before the @
	:prefix => "[ClockingIT]",
	:productName => "ClockingIT",
	:SSL => false
}

ActionMailer::Base.smtp_settings = {
  :address  => "mail.cantv.net",
  :port  => 25,
  :domain  => 'aclocking.com'
}
load_from_env("DOMAIN", :domain, $CONFIG)
load_from_env("REPLYTO", :replyto, $CONFIG)
load_from_env("FROM", :from, $CONFIG)
load_from_env("PREFIX", :prefix, $CONFIG)
load_from_env("PRODUCT_NAME", :productName, $CONFIG)
load_from_env("USE_SSL", :SSL, $CONFIG) { |s| s == "true" }

# puts "$CONFIG:"
# pp $CONFIG
# puts "\n"

