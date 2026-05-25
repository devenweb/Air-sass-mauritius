export interface HeroContent {
    title?: string;
    subtitle?: string;
    description?: string;
    image_url?: string;
    highlight?: string;
    banner?: string;
}

export interface IdentityContent {
    subheadline?: string;
    quote?: string;
    years?: string;
    cert?: string;
    experience_image?: string;
}

export interface VisionMissionContent {
    vision_title?: string;
    vision_desc?: string;
    mission_title?: string;
    mission_desc?: string;
}

export interface PageContent {
    hero?: HeroContent;
    identity?: IdentityContent;
    vision_mission?: VisionMissionContent;
    [key: string]: unknown;
}
