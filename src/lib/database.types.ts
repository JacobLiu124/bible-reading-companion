
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "blocks": {
                  Row: {
                    "blocked_id": string,"blocker_id": string,"created_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "blocked_id": string,"blocker_id": string,"created_at"?: string
                  }
                  Update: {
                    "blocked_id"?: string,"blocker_id"?: string,"created_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "blocks_blocked_id_fkey"
      columns: ["blocked_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "blocks_blocker_id_fkey"
      columns: ["blocker_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"check_ins": {
                  Row: {
                    "created_at": string,"local_date": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"local_date": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"local_date"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "check_ins_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"comments": {
                  Row: {
                    "author_id": string,"body": string,"created_at": string,"edited_at": string | null,"id": string,"post_id": string,"removed_at": string | null,"removed_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id": string,"body": string,"created_at"?: string,"edited_at"?: string | null,"id"?: string,"post_id": string,"removed_at"?: string | null,"removed_by"?: string | null
                  }
                  Update: {
                    "author_id"?: string,"body"?: string,"created_at"?: string,"edited_at"?: string | null,"id"?: string,"post_id"?: string,"removed_at"?: string | null,"removed_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "comments_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comments_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "feed_posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comments_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comments_removed_by_fkey"
      columns: ["removed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"global_restrictions": {
                  Row: {
                    "banned": boolean,"muted_until": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "banned"?: boolean,"muted_until"?: string | null,"user_id": string
                  }
                  Update: {
                    "banned"?: boolean,"muted_until"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "global_restrictions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"goal_history": {
                  Row: {
                    "effective_week_start": string,"goal": number,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "effective_week_start": string,"goal": number,"user_id": string
                  }
                  Update: {
                    "effective_week_start"?: string,"goal"?: number,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "goal_history_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"group_invites": {
                  Row: {
                    "code": string,"created_at": string,"created_by": string | null,"expires_at": string,"group_id": string,"revoked": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "code"?: string,"created_at"?: string,"created_by"?: string | null,"expires_at": string,"group_id": string,"revoked"?: boolean
                  }
                  Update: {
                    "code"?: string,"created_at"?: string,"created_by"?: string | null,"expires_at"?: string,"group_id"?: string,"revoked"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "group_invites_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "group_invites_group_id_fkey"
      columns: ["group_id"]
isOneToOne: false
      referencedRelation: "groups"
      referencedColumns: ["id"]
    }
                  ]
                },"group_members": {
                  Row: {
                    "banned": boolean,"group_id": string,"joined_at": string,"muted_until": string | null,"role": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "banned"?: boolean,"group_id": string,"joined_at"?: string,"muted_until"?: string | null,"role"?: string,"user_id": string
                  }
                  Update: {
                    "banned"?: boolean,"group_id"?: string,"joined_at"?: string,"muted_until"?: string | null,"role"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "group_members_group_id_fkey"
      columns: ["group_id"]
isOneToOne: false
      referencedRelation: "groups"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "group_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"groups": {
                  Row: {
                    "created_at": string,"denomination": string | null,"description": string,"id": string,"name": string,"owner_id": string | null,"rules": string,"slug": string,"visibility": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"denomination"?: string | null,"description"?: string,"id"?: string,"name": string,"owner_id"?: string | null,"rules"?: string,"slug": string,"visibility": string
                  }
                  Update: {
                    "created_at"?: string,"denomination"?: string | null,"description"?: string,"id"?: string,"name"?: string,"owner_id"?: string | null,"rules"?: string,"slug"?: string,"visibility"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "groups_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"moderation_actions": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_username": string,"created_at": string,"expires_at": string | null,"group_id": string | null,"group_name": string | null,"id": string,"is_global": boolean,"reason": string | null,"target_user_id": string | null,"target_username": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_username": string,"created_at"?: string,"expires_at"?: string | null,"group_id"?: string | null,"group_name"?: string | null,"id"?: string,"is_global": boolean,"reason"?: string | null,"target_user_id"?: string | null,"target_username"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_username"?: string,"created_at"?: string,"expires_at"?: string | null,"group_id"?: string | null,"group_name"?: string | null,"id"?: string,"is_global"?: boolean,"reason"?: string | null,"target_user_id"?: string | null,"target_username"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "moderation_actions_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "moderation_actions_group_id_fkey"
      columns: ["group_id"]
isOneToOne: false
      referencedRelation: "groups"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "moderation_actions_target_user_id_fkey"
      columns: ["target_user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"notices": {
                  Row: {
                    "acknowledged_at": string | null,"created_at": string,"id": string,"kind": string,"message": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "acknowledged_at"?: string | null,"created_at"?: string,"id"?: string,"kind"?: string,"message": string,"user_id": string
                  }
                  Update: {
                    "acknowledged_at"?: string | null,"created_at"?: string,"id"?: string,"kind"?: string,"message"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notices_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"posts": {
                  Row: {
                    "author_id": string,"body": string | null,"created_at": string,"edited_at": string | null,"group_id": string | null,"id": string,"kind": string,"reading_date": string | null,"reference": string | null,"removed_at": string | null,"removed_by": string | null,"title": string | null,"verse_ref": string | null,"verse_text": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id": string,"body"?: string | null,"created_at"?: string,"edited_at"?: string | null,"group_id"?: string | null,"id"?: string,"kind": string,"reading_date"?: string | null,"reference"?: string | null,"removed_at"?: string | null,"removed_by"?: string | null,"title"?: string | null,"verse_ref"?: string | null,"verse_text"?: string | null
                  }
                  Update: {
                    "author_id"?: string,"body"?: string | null,"created_at"?: string,"edited_at"?: string | null,"group_id"?: string | null,"id"?: string,"kind"?: string,"reading_date"?: string | null,"reference"?: string | null,"removed_at"?: string | null,"removed_by"?: string | null,"title"?: string | null,"verse_ref"?: string | null,"verse_text"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "posts_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "posts_group_id_fkey"
      columns: ["group_id"]
isOneToOne: false
      referencedRelation: "groups"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "posts_removed_by_fkey"
      columns: ["removed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"denomination": string | null,"display_name": string,"id": string,"is_demo": boolean,"is_site_admin": boolean,"timezone": string,"username": string,"weekly_goal": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"denomination"?: string | null,"display_name": string,"id": string,"is_demo"?: boolean,"is_site_admin"?: boolean,"timezone"?: string,"username": string,"weekly_goal"?: number
                  }
                  Update: {
                    "created_at"?: string,"denomination"?: string | null,"display_name"?: string,"id"?: string,"is_demo"?: boolean,"is_site_admin"?: boolean,"timezone"?: string,"username"?: string,"weekly_goal"?: number
                  }
                  Relationships: [
                    
                  ]
                },"reactions": {
                  Row: {
                    "created_at": string,"kind": string,"post_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"kind"?: string,"post_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"kind"?: string,"post_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reactions_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "feed_posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reactions_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reactions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"reading_schedule": {
                  Row: {
                    "book": string,"chapter": number,"day": string,"label": string
                  }
                  ComputedFields: never
                  Insert: {
                    "book": string,"chapter": number,"day": string,"label": string
                  }
                  Update: {
                    "book"?: string,"chapter"?: number,"day"?: string,"label"?: string
                  }
                  Relationships: [
                    
                  ]
                },"reports": {
                  Row: {
                    "comment_id": string | null,"content_snapshot": string,"created_at": string,"group_id": string | null,"id": string,"is_global": boolean,"note": string | null,"post_id": string | null,"reason": string,"reporter_id": string | null,"reporter_username": string,"resolved_at": string | null,"resolved_by": string | null,"status": string,"target_user_id": string | null,"target_username": string
                  }
                  ComputedFields: never
                  Insert: {
                    "comment_id"?: string | null,"content_snapshot"?: string,"created_at"?: string,"group_id"?: string | null,"id"?: string,"is_global": boolean,"note"?: string | null,"post_id"?: string | null,"reason": string,"reporter_id"?: string | null,"reporter_username": string,"resolved_at"?: string | null,"resolved_by"?: string | null,"status"?: string,"target_user_id"?: string | null,"target_username": string
                  }
                  Update: {
                    "comment_id"?: string | null,"content_snapshot"?: string,"created_at"?: string,"group_id"?: string | null,"id"?: string,"is_global"?: boolean,"note"?: string | null,"post_id"?: string | null,"reason"?: string,"reporter_id"?: string | null,"reporter_username"?: string,"resolved_at"?: string | null,"resolved_by"?: string | null,"status"?: string,"target_user_id"?: string | null,"target_username"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reports_comment_id_fkey"
      columns: ["comment_id"]
isOneToOne: false
      referencedRelation: "comments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_comment_id_fkey"
      columns: ["comment_id"]
isOneToOne: false
      referencedRelation: "feed_comments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_group_id_fkey"
      columns: ["group_id"]
isOneToOne: false
      referencedRelation: "groups"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "feed_posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_reporter_id_fkey"
      columns: ["reporter_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_resolved_by_fkey"
      columns: ["resolved_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_target_user_id_fkey"
      columns: ["target_user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "feed_comments": {
                  Row: {
                    "author_display_name": string,"author_id": string,"author_username": string,"body": string | null,"can_moderate": boolean | null,"created_at": string,"edited_at": string | null,"id": string,"post_id": string,"removed": boolean | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "comments_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comments_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "feed_posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comments_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    }
                  ]
                },"feed_posts": {
                  Row: {
                    "author_display_name": string,"author_id": string,"author_username": string,"body": string | null,"can_moderate": boolean | null,"comment_count": number | null,"created_at": string,"edited_at": string | null,"group_id": string | null,"group_name": string | null,"group_slug": string | null,"id": string,"kind": string,"reacted_by_me": boolean | null,"reaction_count": number | null,"reading_date": string | null,"reference": string | null,"removed": boolean | null,"title": string | null,"verse_ref": string | null,"verse_text": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "posts_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "posts_group_id_fkey"
      columns: ["group_id"]
isOneToOne: false
      referencedRelation: "groups"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "acknowledge_notice":
{ Args: { "id": string }; Returns: undefined
                           },
"add_comment":
{ Args: { "body": string,"post_id": string }; Returns: {
              "author_id": string,
"body": string,
"created_at": string,
"edited_at": string | null,
"id": string,
"post_id": string,
"removed_at": string | null,
"removed_by": string | null
            }
                          SetofOptions: {
        from: "*"
        to: "comments"
        isOneToOne: true
        isSetofReturn: false
      } },
"am_demo":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"am_site_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"assert_can_moderate":
{ Args: { "actor": string,"gid": string,"target": string }; Returns: undefined
                           },
"assert_can_participate":
{ Args: { "gid": string,"kind": string,"uid": string }; Returns: undefined
                           },
"assert_can_write":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"ban_user":
{ Args: { "group_id": string,"reason": string,"uid": string }; Returns: undefined
                           },
"block_user":
{ Args: { "uid": string }; Returns: undefined
                           },
"can_moderate_group":
{ Args: { "gid": string,"uid": string }; Returns: boolean
                           },
"can_moderate_space":
{ Args: { "gid": string,"uid": string }; Returns: boolean
                           },
"can_read_group":
{ Args: { "gid": string,"uid": string }; Returns: boolean
                           },
"can_read_post":
{ Args: { "pid": string,"uid": string }; Returns: boolean
                           },
"check_in":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"create_general_post":
{ Args: { "body": string,"group_id": string,"title": string }; Returns: {
              "author_id": string,
"body": string | null,
"created_at": string,
"edited_at": string | null,
"group_id": string | null,
"id": string,
"kind": string,
"reading_date": string | null,
"reference": string | null,
"removed_at": string | null,
"removed_by": string | null,
"title": string | null,
"verse_ref": string | null,
"verse_text": string | null
            }
                          SetofOptions: {
        from: "*"
        to: "posts"
        isOneToOne: true
        isSetofReturn: false
      } },
"create_group":
{ Args: { "denomination": string,"description": string,"name": string,"rules": string,"visibility": string }; Returns: {
              "created_at": string,
"denomination": string | null,
"description": string,
"id": string,
"name": string,
"owner_id": string | null,
"rules": string,
"slug": string,
"visibility": string
            }
                          SetofOptions: {
        from: "*"
        to: "groups"
        isOneToOne: true
        isSetofReturn: false
      } },
"create_invite":
{ Args: { "days"?: number,"gid": string }; Returns: string
                           },
"create_reading_post":
{ Args: { "body": string,"group_ids": (string)[],"to_global": boolean,"verse_ref": string,"verse_text": string }; Returns: {
              "author_id": string,
"body": string | null,
"created_at": string,
"edited_at": string | null,
"group_id": string | null,
"id": string,
"kind": string,
"reading_date": string | null,
"reference": string | null,
"removed_at": string | null,
"removed_by": string | null,
"title": string | null,
"verse_ref": string | null,
"verse_text": string | null
            }[]
                          SetofOptions: {
        from: "*"
        to: "posts"
        isOneToOne: false
        isSetofReturn: true
      } },
"delete_comment":
{ Args: { "id": string }; Returns: undefined
                           },
"delete_group":
{ Args: { "gid": string,"reason": string }; Returns: undefined
                           },
"delete_my_account":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"delete_post":
{ Args: { "id": string }; Returns: undefined
                           },
"edit_comment":
{ Args: { "body": string,"id": string }; Returns: undefined
                           },
"edit_post":
{ Args: { "body": string,"id": string,"title": string,"verse_ref": string,"verse_text": string }; Returns: undefined
                           },
"global_restriction":
{ Args: { "uid": string }; Returns: string
                           },
"group_role":
{ Args: { "gid": string,"uid": string }; Returns: string
                           },
"i_can_moderate_group":
{ Args: { "gid": string }; Returns: boolean
                           },
"i_can_read_group":
{ Args: { "gid": string }; Returns: boolean
                           },
"invite_preview":
{ Args: { "invite_code": string }; Returns: {
              "group_id": string,"group_name": string,"slug": string,"valid": boolean
            }[]
                           },
"is_active_member":
{ Args: { "gid": string,"uid": string }; Returns: boolean
                           },
"is_demo":
{ Args: { "uid": string }; Returns: boolean
                           },
"is_site_admin":
{ Args: { "uid": string }; Returns: boolean
                           },
"is_valid_timezone":
{ Args: { "tz": string }; Returns: boolean
                           },
"join_public_group":
{ Args: { "gid": string }; Returns: undefined
                           },
"leave_group":
{ Args: { "gid": string }; Returns: undefined
                           },
"log_action":
{ Args: { "act": string,"actor": string,"expires"?: string,"gid": string,"target": string,"why": string }; Returns: undefined
                           },
"mute_user":
{ Args: { "days": number,"group_id": string,"uid": string }; Returns: undefined
                           },
"my_group_role":
{ Args: { "gid": string }; Returns: string
                           },
"redeem_invite":
{ Args: { "invite_code": string }; Returns: {
              "created_at": string,
"denomination": string | null,
"description": string,
"id": string,
"name": string,
"owner_id": string | null,
"rules": string,
"slug": string,
"visibility": string
            }
                          SetofOptions: {
        from: "*"
        to: "groups"
        isOneToOne: true
        isSetofReturn: false
      } },
"remove_comment":
{ Args: { "id": string,"reason": string }; Returns: undefined
                           },
"remove_post":
{ Args: { "id": string,"reason": string }; Returns: undefined
                           },
"report_content":
{ Args: { "comment_id": string,"note": string,"post_id": string,"reason": string }; Returns: undefined
                           },
"resolve_report":
{ Args: { "id": string,"status": string }; Returns: undefined
                           },
"revoke_invite":
{ Args: { "invite_code": string }; Returns: undefined
                           },
"set_member_role":
{ Args: { "gid": string,"role": string,"uid": string }; Returns: undefined
                           },
"set_weekly_goal":
{ Args: { "goal": number }; Returns: undefined
                           },
"toggle_reaction":
{ Args: { "post_id": string }; Returns: boolean
                           },
"transfer_ownership":
{ Args: { "gid": string,"new_owner": string }; Returns: undefined
                           },
"unban_user":
{ Args: { "group_id": string,"uid": string }; Returns: undefined
                           },
"unblock_user":
{ Args: { "uid": string }; Returns: undefined
                           },
"update_group":
{ Args: { "denomination": string,"description": string,"gid": string,"name": string,"rules": string }; Returns: undefined
                           },
"user_today":
{ Args: { "uid": string }; Returns: string
                           },
"username_available":
{ Args: { "name": string }; Returns: boolean
                           },
"username_of":
{ Args: { "uid": string }; Returns: string
                           },
"warn_user":
{ Args: { "group_id": string,"message": string,"uid": string }; Returns: undefined
                           },
"week_start":
{ Args: { "d": string }; Returns: string
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
