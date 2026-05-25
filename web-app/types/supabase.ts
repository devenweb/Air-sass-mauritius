export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          bio: string | null
          created_at: string | null
          display_order: number | null
          email: string
          id: string
          is_active: boolean | null
          linkedin_url: string | null
          name: string | null
          photo_url: string | null
          role: string | null
          show_on_front_page: boolean | null
          title: string | null
          updated_at: string | null
          user_id: string | null
          username: string
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          display_order?: number | null
          email: string
          id?: string
          is_active?: boolean | null
          linkedin_url?: string | null
          name?: string | null
          photo_url?: string | null
          role?: string | null
          show_on_front_page?: boolean | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          username: string
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          display_order?: number | null
          email?: string
          id?: string
          is_active?: boolean | null
          linkedin_url?: string | null
          name?: string | null
          photo_url?: string | null
          role?: string | null
          show_on_front_page?: boolean | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      auth_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      booking_items: {
        Row: {
          amount: number
          booking_id: string
          created_at: string | null
          id: string
          service_category: string | null
          service_id: string | null
          service_name: string
        }
        Insert: {
          amount?: number
          booking_id: string
          created_at?: string | null
          id?: string
          service_category?: string | null
          service_id?: string | null
          service_name: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string | null
          id?: string
          service_category?: string | null
          service_id?: string | null
          service_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_items_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          amount: number
          check_in_date: string
          check_out_date: string | null
          created_at: string | null
          currency: string | null
          customer_id: string | null
          description: string | null
          end_time: string | null
          id: string
          lounge_name: string | null
          pax_adults: number | null
          pax_children: number | null
          pax_infants: number | null
          pax_teens: number | null
          payment_status: string | null
          service_name: string
          service_type: string
          start_time: string | null
          status: string | null
          tax_amount: number | null
          total_price: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number
          check_in_date: string
          check_out_date?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          lounge_name?: string | null
          pax_adults?: number | null
          pax_children?: number | null
          pax_infants?: number | null
          pax_teens?: number | null
          payment_status?: string | null
          service_name: string
          service_type: string
          start_time?: string | null
          status?: string | null
          tax_amount?: number | null
          total_price?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          check_in_date?: string
          check_out_date?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          lounge_name?: string | null
          pax_adults?: number | null
          pax_children?: number | null
          pax_infants?: number | null
          pax_teens?: number | null
          payment_status?: string | null
          service_name?: string
          service_type?: string
          start_time?: string | null
          status?: string | null
          tax_amount?: number | null
          total_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          link: string | null
          name: string
          show_on_home: boolean | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link?: string | null
          name: string
          show_on_home?: boolean | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string
          show_on_home?: boolean | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      content_blocks: {
        Row: {
          content: Json
          id: string
          page_slug: string
          section_key: string
          updated_at: string
        }
        Insert: {
          content: Json
          id?: string
          page_slug: string
          section_key: string
          updated_at?: string
        }
        Update: {
          content?: Json
          id?: string
          page_slug?: string
          section_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          country: string | null
          created_at: string | null
          email: string
          first_name: string
          id: string
          is_subscriber: boolean | null
          last_interaction_at: string | null
          last_name: string
          marketing_tags: string[] | null
          newsletter_opt_in_date: string | null
          phone: string | null
          status: string | null
          total_bookings_count: number | null
          total_spend: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          country?: string | null
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          is_subscriber?: boolean | null
          last_interaction_at?: string | null
          last_name: string
          marketing_tags?: string[] | null
          newsletter_opt_in_date?: string | null
          phone?: string | null
          status?: string | null
          total_bookings_count?: number | null
          total_spend?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          country?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          is_subscriber?: boolean | null
          last_interaction_at?: string | null
          last_name?: string
          marketing_tags?: string[] | null
          newsletter_opt_in_date?: string | null
          phone?: string | null
          status?: string | null
          total_bookings_count?: number | null
          total_spend?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      editorial_posts: {
        Row: {
          author_id: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          id: string
          published_at: string | null
          slug: string
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          published_at?: string | null
          slug: string
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          published_at?: string | null
          slug?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "editorial_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          name: string
          subject: string | null
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          name: string
          subject?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          name?: string
          subject?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          category: string
          created_at: string
          id: string
          is_published: boolean | null
          order_index: number | null
          question: string
        }
        Insert: {
          answer: string
          category?: string
          created_at?: string
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          question: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          question?: string
        }
        Relationships: []
      }
      hero_slides: {
        Row: {
          alignment: string | null
          animation_type: string | null
          badge_color: string | null
          badge_text: string | null
          created_at: string
          cta: string | null
          cta_link: string | null
          cta_text: string | null
          description: string | null
          duration: number | null
          end_date: string | null
          id: string
          image_url: string
          is_active: boolean | null
          link: string | null
          media_type: string | null
          mobile_image_url: string | null
          order_index: number | null
          overlay_opacity: number | null
          start_date: string | null
          subtitle: string | null
          tag: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          alignment?: string | null
          animation_type?: string | null
          badge_color?: string | null
          badge_text?: string | null
          created_at?: string
          cta?: string | null
          cta_link?: string | null
          cta_text?: string | null
          description?: string | null
          duration?: number | null
          end_date?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          link?: string | null
          media_type?: string | null
          mobile_image_url?: string | null
          order_index?: number | null
          overlay_opacity?: number | null
          start_date?: string | null
          subtitle?: string | null
          tag?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          alignment?: string | null
          animation_type?: string | null
          badge_color?: string | null
          badge_text?: string | null
          created_at?: string
          cta?: string | null
          cta_link?: string | null
          cta_text?: string | null
          description?: string | null
          duration?: number | null
          end_date?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          link?: string | null
          media_type?: string | null
          mobile_image_url?: string | null
          order_index?: number | null
          overlay_opacity?: number | null
          start_date?: string | null
          subtitle?: string | null
          tag?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      hotel_rooms: {
        Row: {
          bed: string | null
          cancellation_policy: string | null
          created_at: string | null
          deposit_policy: string | null
          features: Json | null
          id: string
          image_url: string | null
          is_active: boolean | null
          max_occupancy: number | null
          meal_plan: string | null
          min_stay_days: number | null
          name: string | null
          price_per_night: number | null
          service_id: string | null
          size: string | null
          total_units: number | null
          type: string | null
          updated_at: string | null
          view: string | null
        }
        Insert: {
          bed?: string | null
          cancellation_policy?: string | null
          created_at?: string | null
          deposit_policy?: string | null
          features?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          max_occupancy?: number | null
          meal_plan?: string | null
          min_stay_days?: number | null
          name?: string | null
          price_per_night?: number | null
          service_id?: string | null
          size?: string | null
          total_units?: number | null
          type?: string | null
          updated_at?: string | null
          view?: string | null
        }
        Update: {
          bed?: string | null
          cancellation_policy?: string | null
          created_at?: string | null
          deposit_policy?: string | null
          features?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          max_occupancy?: number | null
          meal_plan?: string | null
          min_stay_days?: number | null
          name?: string | null
          price_per_night?: number | null
          service_id?: string | null
          size?: string | null
          total_units?: number | null
          type?: string | null
          updated_at?: string | null
          view?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hotel_rooms_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          created_at: string
          email: string
          id: string
          lead_data: Json | null
          message: string
          name: string
          phone: string | null
          source: string | null
          status: string | null
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          lead_data?: Json | null
          message: string
          name: string
          phone?: string | null
          source?: string | null
          status?: string | null
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          lead_data?: Json | null
          message?: string
          name?: string
          phone?: string | null
          source?: string | null
          status?: string | null
          subject?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          amount: number | null
          created_at: string | null
          id: string
          invoice_id: string
          item_description: string
          quantity: number | null
          unit_price: number
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          id?: string
          invoice_id: string
          item_description: string
          quantity?: number | null
          unit_price?: number
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          id?: string
          invoice_id?: string
          item_description?: string
          quantity?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          due_date: string | null
          id: string
          reference: string | null
          service: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          due_date?: string | null
          id?: string
          reference?: string | null
          service: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          due_date?: string | null
          id?: string
          reference?: string | null
          service?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      navigations: {
        Row: {
          created_at: string
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          label: string
          link: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          link: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          link?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "navigations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "navigations"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          quantity: number | null
          service_id: string | null
          service_name: string | null
          total_price: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          quantity?: number | null
          service_id?: string | null
          service_name?: string | null
          total_price?: number | null
          unit_price?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          quantity?: number | null
          service_id?: string | null
          service_name?: string | null
          total_price?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount: number
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          id: string
          items: Json | null
          payment_method: string | null
          status: string | null
          total_items: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          id?: string
          items?: Json | null
          payment_method?: string | null
          status?: string | null
          total_items?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          id?: string
          items?: Json | null
          payment_method?: string | null
          status?: string | null
          total_items?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          logo_url: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          logo_url: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          logo_url?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      popular_destinations: {
        Row: {
          country: string | null
          destination: string
          id: string
          image_url: string | null
          is_featured: boolean | null
          return_price: number
        }
        Insert: {
          country?: string | null
          destination: string
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          return_price: number
        }
        Update: {
          country?: string | null
          destination?: string
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          return_price?: number
        }
        Relationships: []
      }
      popup_ads: {
        Row: {
          content: string | null
          created_at: string | null
          cta_link: string | null
          cta_text: string | null
          display_frequency: string | null
          end_at: string | null
          id: string
          is_active: boolean | null
          media_type: string | null
          media_url: string | null
          popup_type: string | null
          start_at: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          cta_link?: string | null
          cta_text?: string | null
          display_frequency?: string | null
          end_at?: string | null
          id?: string
          is_active?: boolean | null
          media_type?: string | null
          media_url?: string | null
          popup_type?: string | null
          start_at?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          cta_link?: string | null
          cta_text?: string | null
          display_frequency?: string | null
          end_at?: string | null
          id?: string
          is_active?: boolean | null
          media_type?: string | null
          media_url?: string | null
          popup_type?: string | null
          start_at?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string
          product_id: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          product_id?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          itinerary: Json | null
          name: string
          price: number
          room_types: Json | null
          status: string | null
          stock: number | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          itinerary?: Json | null
          name: string
          price?: number
          room_types?: Json | null
          status?: string | null
          stock?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          itinerary?: Json | null
          name?: string
          price?: number
          room_types?: Json | null
          status?: string | null
          stock?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          loyalty_points: number | null
          name: string
          phone: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          loyalty_points?: number | null
          name: string
          phone?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          loyalty_points?: number | null
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          id: string
          rating: number | null
          service_id: string | null
          service_type: string | null
          status: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          id?: string
          rating?: number | null
          service_id?: string | null
          service_type?: string | null
          status?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          id?: string
          rating?: number | null
          service_id?: string | null
          service_type?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      room_types: {
        Row: {
          amenities: string[] | null
          description: string | null
          id: string
          image_url: string | null
          images: string[] | null
          max_adults: number | null
          max_children: number | null
          max_infants: number | null
          max_occupancy: number | null
          max_teens: number | null
          meal_plan: string | null
          min_stay_days: number | null
          name: string
          service_fee: number | null
          service_id: string | null
        }
        Insert: {
          amenities?: string[] | null
          description?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          max_adults?: number | null
          max_children?: number | null
          max_infants?: number | null
          max_occupancy?: number | null
          max_teens?: number | null
          meal_plan?: string | null
          min_stay_days?: number | null
          name: string
          service_fee?: number | null
          service_id?: string | null
        }
        Update: {
          amenities?: string[] | null
          description?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          max_adults?: number | null
          max_children?: number | null
          max_infants?: number | null
          max_occupancy?: number | null
          max_teens?: number | null
          meal_plan?: string | null
          min_stay_days?: number | null
          name?: string
          service_fee?: number | null
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_types_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string
          service_id: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          service_id?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_categories_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_pricing: {
        Row: {
          created_at: string | null
          currency: string | null
          date_from: string
          date_to: string
          id: string
          is_stop_sell: boolean | null
          label: string | null
          meal_plan_id: string | null
          net_occupancy_pricing: Json | null
          net_price: number | null
          net_price_child: number | null
          net_price_infant: number | null
          net_price_teen: number | null
          notes: string | null
          occupancy_pricing: Json | null
          price: number
          price_child: number
          price_infant: number
          price_teen: number
          price_type: string | null
          service_fee: number | null
          service_id: string
          units_available: number | null
          updated_at: string | null
          variant_id: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          date_from: string
          date_to: string
          id?: string
          is_stop_sell?: boolean | null
          label?: string | null
          meal_plan_id?: string | null
          net_occupancy_pricing?: Json | null
          net_price?: number | null
          net_price_child?: number | null
          net_price_infant?: number | null
          net_price_teen?: number | null
          notes?: string | null
          occupancy_pricing?: Json | null
          price?: number
          price_child?: number
          price_infant?: number
          price_teen?: number
          price_type?: string | null
          service_fee?: number | null
          service_id: string
          units_available?: number | null
          updated_at?: string | null
          variant_id?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          date_from?: string
          date_to?: string
          id?: string
          is_stop_sell?: boolean | null
          label?: string | null
          meal_plan_id?: string | null
          net_occupancy_pricing?: Json | null
          net_price?: number | null
          net_price_child?: number | null
          net_price_infant?: number | null
          net_price_teen?: number | null
          notes?: string | null
          occupancy_pricing?: Json | null
          price?: number
          price_child?: number
          price_infant?: number
          price_teen?: number
          price_type?: string | null
          service_fee?: number | null
          service_id?: string
          units_available?: number | null
          updated_at?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_pricing_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          activity_type: string | null
          amenities: string[] | null
          banner_url: string | null
          cancellation_policy: string | null
          child_age_limit: number | null
          created_at: string | null
          cta_link: string | null
          cta_text: string | null
          deal_note: string | null
          description: string | null
          duration_days: number | null
          duration_hours: number | null
          featured: boolean | null
          gallery_images: string[] | null
          highlights: Json | null
          id: string
          image_url: string | null
          included: Json | null
          is_active: boolean | null
          is_coming_soon: boolean | null
          is_seasonal_deal: boolean | null
          itinerary: Json | null
          location: string | null
          max_adults: number | null
          max_children: number | null
          max_group_size: number | null
          meal_plans: Json | null
          meta_description: string | null
          meta_title: string | null
          name: string
          not_included: Json | null
          priority: number | null
          rating: number | null
          region: string | null
          room_types: Json | null
          seasonality: string | null
          secondary_image_url: string | null
          seo_keywords: string | null
          service_fee: number | null
          service_type: string | null
          short_description: string | null
          special_features: Json | null
          status: string | null
          stock: number | null
          terms_and_conditions: string | null
          thumbnail_url: string | null
          updated_at: string | null
        }
        Insert: {
          activity_type?: string | null
          amenities?: string[] | null
          banner_url?: string | null
          cancellation_policy?: string | null
          child_age_limit?: number | null
          created_at?: string | null
          cta_link?: string | null
          cta_text?: string | null
          deal_note?: string | null
          description?: string | null
          duration_days?: number | null
          duration_hours?: number | null
          featured?: boolean | null
          gallery_images?: string[] | null
          highlights?: Json | null
          id?: string
          image_url?: string | null
          included?: Json | null
          is_active?: boolean | null
          is_coming_soon?: boolean | null
          is_seasonal_deal?: boolean | null
          itinerary?: Json | null
          location?: string | null
          max_adults?: number | null
          max_children?: number | null
          max_group_size?: number | null
          meal_plans?: Json | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          not_included?: Json | null
          priority?: number | null
          rating?: number | null
          region?: string | null
          room_types?: Json | null
          seasonality?: string | null
          secondary_image_url?: string | null
          seo_keywords?: string | null
          service_fee?: number | null
          service_type?: string | null
          short_description?: string | null
          special_features?: Json | null
          status?: string | null
          stock?: number | null
          terms_and_conditions?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Update: {
          activity_type?: string | null
          amenities?: string[] | null
          banner_url?: string | null
          cancellation_policy?: string | null
          child_age_limit?: number | null
          created_at?: string | null
          cta_link?: string | null
          cta_text?: string | null
          deal_note?: string | null
          description?: string | null
          duration_days?: number | null
          duration_hours?: number | null
          featured?: boolean | null
          gallery_images?: string[] | null
          highlights?: Json | null
          id?: string
          image_url?: string | null
          included?: Json | null
          is_active?: boolean | null
          is_coming_soon?: boolean | null
          is_seasonal_deal?: boolean | null
          itinerary?: Json | null
          location?: string | null
          max_adults?: number | null
          max_children?: number | null
          max_group_size?: number | null
          meal_plans?: Json | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          not_included?: Json | null
          priority?: number | null
          rating?: number | null
          region?: string | null
          room_types?: Json | null
          seasonality?: string | null
          secondary_image_url?: string | null
          seo_keywords?: string | null
          service_fee?: number | null
          service_type?: string | null
          short_description?: string | null
          special_features?: Json | null
          status?: string | null
          stock?: number | null
          terms_and_conditions?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          category: string
          description: string | null
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          category: string
          description?: string | null
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          category?: string
          description?: string | null
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          status: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          status?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          status?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_content: { Args: never; Returns: boolean }
      can_manage_operations: { Args: never; Returns: boolean }
      check_user_is_admin: {
        Args: { checked_user_id: string }
        Returns: boolean
      }
      create_booking_v1: {
        Args: { p_booking_data: Json; p_items_data: Json }
        Returns: Json
      }
      get_auth_admin_status:
        | {
            Args: { p_user_id: string }
            Returns: {
              bio: string | null
              created_at: string | null
              display_order: number | null
              email: string
              id: string
              is_active: boolean | null
              linkedin_url: string | null
              name: string | null
              photo_url: string | null
              role: string | null
              show_on_front_page: boolean | null
              title: string | null
              updated_at: string | null
              user_id: string | null
              username: string
            }[]
            SetofOptions: {
              from: "*"
              to: "admins"
              isOneToOne: false
              isSetofReturn: true
            }
          }
        | { Args: { p_email?: string; p_user_id: string }; Returns: Json }
      get_or_create_customer_v1: {
        Args: {
          p_email: string
          p_first_name?: string
          p_last_name?: string
          p_phone?: string
          p_user_id?: string
        }
        Returns: string
      }
      is_active_staff: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_admin_or_staff: { Args: never; Returns: boolean }
      is_admin_v2: { Args: never; Returns: boolean }
      is_authorized_staff: { Args: never; Returns: boolean }
      is_elevated_admin: { Args: never; Returns: boolean }
      is_secretary: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      reorder_hero_slides: { Args: { new_orders: Json }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
