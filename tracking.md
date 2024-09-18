I create a new datatable called `activities` to track user activities.

The schema is as follows:

- activity_id (uuid)
- organization_id (uuid)
- user_id (uuid)
- activity_type (string)
- description (string)
- activity_details (jsonb)

I created a recordActivity function to insert activities into the database. @see lib/track.ts

I want to track the following activities:
user_registration: '{name} registered for the application.'

user_login: '{name} logged in.'

user_logout: '{name} logged out.'

organization_created: '{name} created a new organization: {organization_name}.'

organization_updated: '{name} updated the organization: {organization_name}.'

membership_joined: '{name} joined the membership: {membership_name}.'

membership_left: '{name} left the membership: {membership_name}.'

event_created: '{name} created a new event: {event_title}.'

event_updated: '{name} updated the event: {event_title}.'

event_registration: '{name} registered for the event: {event_title}.'

post_created: '{name} created a new post.'

post_commented: '{name} commented on a post.'

payment_processed: 'Payment processed for {name} for {event_title} or {membership_name}.'

notification_sent: 'Notification sent to {name} regarding updates in {organization_name}.'

role_assigned: '{name} was assigned the role of {role_name} in {organization_name}.'

organization_deleted: '{name} deleted the organization: {organization_name}.'

event_deleted: '{name} deleted the event: {event_title}.'

post_deleted: '{name} deleted the post.'

post_comment_deleted: '{name} deleted the comment.'

Note that the activity_details jsonb column can be used to store additional details for each activity type. organizationid could be null for activites that are not related to an organization.
