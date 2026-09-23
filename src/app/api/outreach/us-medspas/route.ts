import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const MESSAGES = [
  {
    "recipient": "info@bijouxmedspa.com",
    "leadName": "Bijoux Med Spa & Wellness",
    "company": "Bijoux Med Spa & Wellness",
    "city": "Orlando",
    "rating": 5,
    "subject": "quick question regarding Bijoux Med Spa & Wellness VIP consultation booking workflow",
    "body": "Hi Bijoux Med Spa & Wellness team,\n\nI was looking into premier medical spas and aesthetic clinics in Orlando and noticed Bijoux Med Spa & Wellness has earned an outstanding 5★ patient reputation in Orlando, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for Bijoux Med Spa & Wellness's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed Bijoux Med Spa & Wellness has earned an outstanding 5★ patient reputation in Orlando, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries"
  },
  {
    "recipient": "erica@lighttouchorlando.com",
    "leadName": "LightTouch Med Spa",
    "company": "LightTouch Med Spa",
    "city": "Orlando",
    "rating": 4.8,
    "subject": "quick question regarding LightTouch Med Spa aesthetic consultation booking workflow",
    "body": "Hi LightTouch Med Spa team,\n\nI was looking into premier medical spas and aesthetic clinics in Orlando and noticed LightTouch Med Spa has great reviews in Orlando, but your mobile website currently requires prospective patients to call or fill static contact forms rather than reserving aesthetic consultations instantly.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for LightTouch Med Spa's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed LightTouch Med Spa has great reviews in Orlando, but your mobile website currently requires prospective patients to call or fill static contact forms rather than reserving aesthetic consultations instantly"
  },
  {
    "recipient": "info@thepalmmedspa.com",
    "leadName": "The Palm Medspa + Wellness",
    "company": "The Palm Medspa + Wellness",
    "city": "Orlando",
    "rating": 5,
    "subject": "quick question regarding The Palm Medspa + Wellness VIP consultation booking workflow",
    "body": "Hi The Palm Medspa + Wellness team,\n\nI was looking into premier medical spas and aesthetic clinics in Orlando and noticed The Palm Medspa + Wellness has earned an outstanding 5★ patient reputation in Orlando, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for The Palm Medspa + Wellness's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed The Palm Medspa + Wellness has earned an outstanding 5★ patient reputation in Orlando, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries"
  },
  {
    "recipient": "info@thenurmedspa.com",
    "leadName": "NUR MedSpa & Wellness Lake Nona",
    "company": "NUR MedSpa & Wellness Lake Nona",
    "city": "Orlando",
    "rating": 4.9,
    "subject": "quick question regarding NUR MedSpa & Wellness Lake Nona VIP consultation booking workflow",
    "body": "Hi NUR MedSpa & Wellness Lake Nona team,\n\nI was looking into premier medical spas and aesthetic clinics in Orlando and noticed NUR MedSpa & Wellness Lake Nona has earned an outstanding 4.9★ patient reputation in Orlando, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for NUR MedSpa & Wellness Lake Nona's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed NUR MedSpa & Wellness Lake Nona has earned an outstanding 4.9★ patient reputation in Orlando, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries"
  },
  {
    "recipient": "contact@miskmedspa.com",
    "leadName": "Misk Med Spa & Wellness",
    "company": "Misk Med Spa & Wellness",
    "city": "Orlando",
    "rating": 5,
    "subject": "quick question regarding Misk Med Spa & Wellness VIP consultation booking workflow",
    "body": "Hi Misk Med Spa & Wellness team,\n\nI was looking into premier medical spas and aesthetic clinics in Orlando and noticed Misk Med Spa & Wellness has earned an outstanding 5★ patient reputation in Orlando, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for Misk Med Spa & Wellness's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed Misk Med Spa & Wellness has earned an outstanding 5★ patient reputation in Orlando, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries"
  },
  {
    "recipient": "support@windermeremedicalspa.com",
    "leadName": "Windermere Medical Spa",
    "company": "Windermere Medical Spa",
    "city": "Orlando",
    "rating": 4.9,
    "subject": "quick question regarding Windermere Medical Spa VIP consultation booking workflow",
    "body": "Hi Windermere Medical Spa team,\n\nI was looking into premier medical spas and aesthetic clinics in Orlando and noticed Windermere Medical Spa has earned an outstanding 4.9★ patient reputation in Orlando, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for Windermere Medical Spa's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed Windermere Medical Spa has earned an outstanding 4.9★ patient reputation in Orlando, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries"
  },
  {
    "recipient": "sodo@viomedspa.com",
    "leadName": "VIO Med Spa",
    "company": "VIO Med Spa",
    "city": "Orlando",
    "rating": 4.9,
    "subject": "quick question regarding VIO Med Spa VIP consultation booking workflow",
    "body": "Hi VIO Med Spa team,\n\nI was looking into premier medical spas and aesthetic clinics in Orlando and noticed VIO Med Spa has earned an outstanding 4.9★ patient reputation in Orlando, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for VIO Med Spa's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed VIO Med Spa has earned an outstanding 4.9★ patient reputation in Orlando, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries"
  },
  {
    "recipient": "%20support@agelessspaorl.com",
    "leadName": "Ageless Spa Center",
    "company": "Ageless Spa Center",
    "city": "Orlando",
    "rating": 4.9,
    "subject": "quick question regarding Ageless Spa Center VIP consultation booking workflow",
    "body": "Hi Ageless Spa Center team,\n\nI was looking into premier medical spas and aesthetic clinics in Orlando and noticed Ageless Spa Center has earned an outstanding 4.9★ patient reputation in Orlando, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for Ageless Spa Center's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed Ageless Spa Center has earned an outstanding 4.9★ patient reputation in Orlando, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries"
  },
  {
    "recipient": "drphillipsmedicalspa@gmail.com",
    "leadName": "Dr. Phillips Medical Spa",
    "company": "Dr. Phillips Medical Spa",
    "city": "Orlando",
    "rating": 4.8,
    "subject": "quick question regarding Dr. Phillips Medical Spa aesthetic consultation booking workflow",
    "body": "Hi Dr. Phillips Medical Spa team,\n\nI was looking into premier medical spas and aesthetic clinics in Orlando and noticed Dr. Phillips Medical Spa has great reviews in Orlando, but your mobile website currently requires prospective patients to call or fill static contact forms rather than reserving aesthetic consultations instantly.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for Dr. Phillips Medical Spa's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed Dr. Phillips Medical Spa has great reviews in Orlando, but your mobile website currently requires prospective patients to call or fill static contact forms rather than reserving aesthetic consultations instantly"
  },
  {
    "recipient": "info@healthyglowmedspa.com",
    "leadName": "Healthy Glow Med Spa",
    "company": "Healthy Glow Med Spa",
    "city": "Orlando",
    "rating": 5,
    "subject": "quick question regarding Healthy Glow Med Spa VIP consultation booking workflow",
    "body": "Hi Healthy Glow Med Spa team,\n\nI was looking into premier medical spas and aesthetic clinics in Orlando and noticed Healthy Glow Med Spa has earned an outstanding 5★ patient reputation in Orlando, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for Healthy Glow Med Spa's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed Healthy Glow Med Spa has earned an outstanding 5★ patient reputation in Orlando, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries"
  },
  {
    "recipient": "info@unikmedspa.com",
    "leadName": "Univë Med Spa",
    "company": "Univë Med Spa",
    "city": "Orlando",
    "rating": 4.9,
    "subject": "quick question regarding Univë Med Spa VIP consultation booking workflow",
    "body": "Hi Univë Med Spa team,\n\nI was looking into premier medical spas and aesthetic clinics in Orlando and noticed Univë Med Spa has earned an outstanding 4.9★ patient reputation in Orlando, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for Univë Med Spa's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed Univë Med Spa has earned an outstanding 4.9★ patient reputation in Orlando, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries"
  },
  {
    "recipient": "info@pureenvymedspa.com",
    "leadName": "Pure Envy Med Spa",
    "company": "Pure Envy Med Spa",
    "city": "Orlando",
    "rating": 4.9,
    "subject": "quick question regarding Pure Envy Med Spa VIP consultation booking workflow",
    "body": "Hi Pure Envy Med Spa team,\n\nI was looking into premier medical spas and aesthetic clinics in Orlando and noticed Pure Envy Med Spa has earned an outstanding 4.9★ patient reputation in Orlando, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for Pure Envy Med Spa's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed Pure Envy Med Spa has earned an outstanding 4.9★ patient reputation in Orlando, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries"
  },
  {
    "recipient": "megan@tal-spa.com",
    "leadName": "The Aesthetics Lounge and Spa Orlando",
    "company": "The Aesthetics Lounge and Spa Orlando",
    "city": "Orlando",
    "rating": 5,
    "subject": "quick question regarding The Aesthetics Lounge and Spa Orlando VIP consultation booking workflow",
    "body": "Hi The Aesthetics Lounge and Spa Orlando team,\n\nI was looking into premier medical spas and aesthetic clinics in Orlando and noticed The Aesthetics Lounge and Spa Orlando has earned an outstanding 5★ patient reputation in Orlando, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for The Aesthetics Lounge and Spa Orlando's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed The Aesthetics Lounge and Spa Orlando has earned an outstanding 5★ patient reputation in Orlando, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries"
  },
  {
    "recipient": "info@sanctuarysalonmedspa.com",
    "leadName": "Sanctuary Salon & Med Spa",
    "company": "Sanctuary Salon & Med Spa",
    "city": "Orlando",
    "rating": 4.8,
    "subject": "quick question regarding Sanctuary Salon & Med Spa aesthetic consultation booking workflow",
    "body": "Hi Sanctuary Salon & Med Spa team,\n\nI was looking into premier medical spas and aesthetic clinics in Orlando and noticed Sanctuary Salon & Med Spa has great reviews in Orlando, but your mobile website currently requires prospective patients to call or fill static contact forms rather than reserving aesthetic consultations instantly.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for Sanctuary Salon & Med Spa's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed Sanctuary Salon & Med Spa has great reviews in Orlando, but your mobile website currently requires prospective patients to call or fill static contact forms rather than reserving aesthetic consultations instantly"
  },
  {
    "recipient": "zoyamedicalorlando@gmail.com",
    "leadName": "Zoya Medical Orlando",
    "company": "Zoya Medical Orlando",
    "city": "Orlando",
    "rating": 5,
    "subject": "quick question regarding Zoya Medical Orlando VIP consultation booking workflow",
    "body": "Hi Zoya Medical Orlando team,\n\nI was looking into premier medical spas and aesthetic clinics in Orlando and noticed Zoya Medical Orlando has earned an outstanding 5★ patient reputation in Orlando, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for Zoya Medical Orlando's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed Zoya Medical Orlando has earned an outstanding 5★ patient reputation in Orlando, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries"
  },
  {
    "recipient": "info@premierwellnessmedspa.com",
    "leadName": "Premier Wellness Medspa",
    "company": "Premier Wellness Medspa",
    "city": "Orlando",
    "rating": 5,
    "subject": "quick question regarding Premier Wellness Medspa VIP consultation booking workflow",
    "body": "Hi Premier Wellness Medspa team,\n\nI was looking into premier medical spas and aesthetic clinics in Orlando and noticed Premier Wellness Medspa has earned an outstanding 5★ patient reputation in Orlando, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for Premier Wellness Medspa's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed Premier Wellness Medspa has earned an outstanding 5★ patient reputation in Orlando, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries"
  },
  {
    "recipient": "support@oneaesthetics.com",
    "leadName": "One Aesthetics",
    "company": "One Aesthetics",
    "city": "Orlando",
    "rating": 4.9,
    "subject": "quick question regarding One Aesthetics VIP consultation booking workflow",
    "body": "Hi One Aesthetics team,\n\nI was looking into premier medical spas and aesthetic clinics in Orlando and noticed One Aesthetics has earned an outstanding 4.9★ patient reputation in Orlando, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for One Aesthetics's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed One Aesthetics has earned an outstanding 4.9★ patient reputation in Orlando, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries"
  },
  {
    "recipient": "deltaspaorlando@gmail.com",
    "leadName": "Delta Spa",
    "company": "Delta Spa",
    "city": "Orlando",
    "rating": 5,
    "subject": "quick question regarding Delta Spa VIP consultation booking workflow",
    "body": "Hi Delta Spa team,\n\nI was looking into premier medical spas and aesthetic clinics in Orlando and noticed Delta Spa has earned an outstanding 5★ patient reputation in Orlando, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for Delta Spa's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed Delta Spa has earned an outstanding 5★ patient reputation in Orlando, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries"
  },
  {
    "recipient": "name@domain.com",
    "leadName": "Look Lab Med Spa",
    "company": "Look Lab Med Spa",
    "city": "Winter Park",
    "rating": 5,
    "subject": "quick question regarding Look Lab Med Spa VIP consultation booking workflow",
    "body": "Hi Look Lab Med Spa team,\n\nI was looking into premier medical spas and aesthetic clinics in Winter Park and noticed Look Lab Med Spa has earned an outstanding 5★ patient reputation in Winter Park, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for Look Lab Med Spa's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed Look Lab Med Spa has earned an outstanding 5★ patient reputation in Winter Park, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries"
  },
  {
    "recipient": "info@180medspa.com",
    "leadName": "180 MedSpa",
    "company": "180 MedSpa",
    "city": "Winter Park",
    "rating": 4.8,
    "subject": "quick question regarding 180 MedSpa aesthetic consultation booking workflow",
    "body": "Hi 180 MedSpa team,\n\nI was looking into premier medical spas and aesthetic clinics in Winter Park and noticed 180 MedSpa has great reviews in Winter Park, but your mobile website currently requires prospective patients to call or fill static contact forms rather than reserving aesthetic consultations instantly.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for 180 MedSpa's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed 180 MedSpa has great reviews in Winter Park, but your mobile website currently requires prospective patients to call or fill static contact forms rather than reserving aesthetic consultations instantly"
  },
  {
    "recipient": "angelaestheticsmedspa@gmail.com",
    "leadName": "Angel Aesthetics Med Spa",
    "company": "Angel Aesthetics Med Spa",
    "city": "Orlando",
    "rating": 5,
    "subject": "quick question regarding Angel Aesthetics Med Spa VIP consultation booking workflow",
    "body": "Hi Angel Aesthetics Med Spa team,\n\nI was looking into premier medical spas and aesthetic clinics in Orlando and noticed Angel Aesthetics Med Spa has earned an outstanding 5★ patient reputation in Orlando, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for Angel Aesthetics Med Spa's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed Angel Aesthetics Med Spa has earned an outstanding 5★ patient reputation in Orlando, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries"
  },
  {
    "recipient": "connect@couturemedspa.com",
    "leadName": "Couture Med Spa",
    "company": "Couture Med Spa",
    "city": "Winter Park",
    "rating": 4.6,
    "subject": "quick question regarding Couture Med Spa aesthetic consultation booking workflow",
    "body": "Hi Couture Med Spa team,\n\nI was looking into premier medical spas and aesthetic clinics in Winter Park and noticed Couture Med Spa has great reviews in Winter Park, but your mobile website currently requires prospective patients to call or fill static contact forms rather than reserving aesthetic consultations instantly.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for Couture Med Spa's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed Couture Med Spa has great reviews in Winter Park, but your mobile website currently requires prospective patients to call or fill static contact forms rather than reserving aesthetic consultations instantly"
  },
  {
    "recipient": "beautystudioorlando@gmail.com",
    "leadName": "Orlando Beauty Studio - SPA & Face Treatments",
    "company": "Orlando Beauty Studio - SPA & Face Treatments",
    "city": "Orlando",
    "rating": 5,
    "subject": "quick question regarding Orlando Beauty Studio - SPA & Face Treatments VIP consultation booking workflow",
    "body": "Hi Orlando Beauty Studio - SPA & Face Treatments team,\n\nI was looking into premier medical spas and aesthetic clinics in Orlando and noticed Orlando Beauty Studio - SPA & Face Treatments has earned an outstanding 5★ patient reputation in Orlando, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for Orlando Beauty Studio - SPA & Face Treatments's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed Orlando Beauty Studio - SPA & Face Treatments has earned an outstanding 5★ patient reputation in Orlando, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries"
  },
  {
    "recipient": "sapphiramedspa@gmail.com",
    "leadName": "Sapphira Privé Orlando",
    "company": "Sapphira Privé Orlando",
    "city": "Orlando",
    "rating": 4.9,
    "subject": "quick question regarding Sapphira Privé Orlando VIP consultation booking workflow",
    "body": "Hi Sapphira Privé Orlando team,\n\nI was looking into premier medical spas and aesthetic clinics in Orlando and noticed Sapphira Privé Orlando has earned an outstanding 4.9★ patient reputation in Orlando, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for Sapphira Privé Orlando's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed Sapphira Privé Orlando has earned an outstanding 4.9★ patient reputation in Orlando, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries"
  },
  {
    "recipient": "info@apexfit.com",
    "leadName": "Apex Med Spa",
    "company": "Apex Med Spa",
    "city": "Orlando",
    "rating": 4.8,
    "subject": "quick question regarding Apex Med Spa aesthetic consultation booking workflow",
    "body": "Hi Apex Med Spa team,\n\nI was looking into premier medical spas and aesthetic clinics in Orlando and noticed Apex Med Spa has great reviews in Orlando, but your mobile website currently requires prospective patients to call or fill static contact forms rather than reserving aesthetic consultations instantly.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for Apex Med Spa's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed Apex Med Spa has great reviews in Orlando, but your mobile website currently requires prospective patients to call or fill static contact forms rather than reserving aesthetic consultations instantly"
  },
  {
    "recipient": "info@polishedbeautymedspa.com",
    "leadName": "Polished Beauty Medspa",
    "company": "Polished Beauty Medspa",
    "city": "Winter Park",
    "rating": 5,
    "subject": "quick question regarding Polished Beauty Medspa VIP consultation booking workflow",
    "body": "Hi Polished Beauty Medspa team,\n\nI was looking into premier medical spas and aesthetic clinics in Winter Park and noticed Polished Beauty Medspa has earned an outstanding 5★ patient reputation in Winter Park, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for Polished Beauty Medspa's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed Polished Beauty Medspa has earned an outstanding 5★ patient reputation in Winter Park, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries"
  },
  {
    "recipient": "bebeautifulorlando@gmail.com",
    "leadName": "Beautiful Orlando Spa and Cosmetic",
    "company": "Beautiful Orlando Spa and Cosmetic",
    "city": "Kissimmee",
    "rating": 4.6,
    "subject": "quick question regarding Beautiful Orlando Spa and Cosmetic aesthetic consultation booking workflow",
    "body": "Hi Beautiful Orlando Spa and Cosmetic team,\n\nI was looking into premier medical spas and aesthetic clinics in Kissimmee and noticed Beautiful Orlando Spa and Cosmetic has great reviews in Kissimmee, but your mobile website currently requires prospective patients to call or fill static contact forms rather than reserving aesthetic consultations instantly.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for Beautiful Orlando Spa and Cosmetic's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed Beautiful Orlando Spa and Cosmetic has great reviews in Kissimmee, but your mobile website currently requires prospective patients to call or fill static contact forms rather than reserving aesthetic consultations instantly"
  },
  {
    "recipient": "lorensmedicalspa@gmail.com",
    "leadName": "LS Medical Spa",
    "company": "LS Medical Spa",
    "city": "Orlando",
    "rating": 4.3,
    "subject": "quick question regarding LS Medical Spa patient intake workflow",
    "body": "Hi LS Medical Spa team,\n\nI was looking into premier medical spas and aesthetic clinics in Orlando and came across LS Medical Spa while researching top-rated medical spas in Orlando and noticed several key opportunities to streamline your patient inquiry flow.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for LS Medical Spa's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "came across LS Medical Spa while researching top-rated medical spas in Orlando and noticed several key opportunities to streamline your patient inquiry flow"
  },
  {
    "recipient": "info@skinnv.com",
    "leadName": "Skin NV Tampa Med Spa",
    "company": "Skin NV Tampa Med Spa",
    "city": "Tampa",
    "rating": 4.8,
    "subject": "quick question regarding Skin NV Tampa Med Spa aesthetic consultation booking workflow",
    "body": "Hi Skin NV Tampa Med Spa team,\n\nI was looking into premier medical spas and aesthetic clinics in Tampa and noticed Skin NV Tampa Med Spa has great reviews in Tampa, but your mobile website currently requires prospective patients to call or fill static contact forms rather than reserving aesthetic consultations instantly.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for Skin NV Tampa Med Spa's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed Skin NV Tampa Med Spa has great reviews in Tampa, but your mobile website currently requires prospective patients to call or fill static contact forms rather than reserving aesthetic consultations instantly"
  },
  {
    "recipient": "southtampa@elase.com",
    "leadName": "Elase Medical Spa - South Tampa",
    "company": "Elase Medical Spa - South Tampa",
    "city": "Tampa",
    "rating": 4.9,
    "subject": "quick question regarding Elase Medical Spa - South Tampa VIP consultation booking workflow",
    "body": "Hi Elase Medical Spa - South Tampa team,\n\nI was looking into premier medical spas and aesthetic clinics in Tampa and noticed Elase Medical Spa - South Tampa has earned an outstanding 4.9★ patient reputation in Tampa, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for Elase Medical Spa - South Tampa's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed Elase Medical Spa - South Tampa has earned an outstanding 4.9★ patient reputation in Tampa, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries"
  },
  {
    "recipient": "info@lecadatampa.com",
    "leadName": "Lecada Medical Artistry",
    "company": "Lecada Medical Artistry",
    "city": "Tampa",
    "rating": 4.7,
    "subject": "quick question regarding Lecada Medical Artistry aesthetic consultation booking workflow",
    "body": "Hi Lecada Medical Artistry team,\n\nI was looking into premier medical spas and aesthetic clinics in Tampa and noticed Lecada Medical Artistry has great reviews in Tampa, but your mobile website currently requires prospective patients to call or fill static contact forms rather than reserving aesthetic consultations instantly.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for Lecada Medical Artistry's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed Lecada Medical Artistry has great reviews in Tampa, but your mobile website currently requires prospective patients to call or fill static contact forms rather than reserving aesthetic consultations instantly"
  },
  {
    "recipient": "ampa@elevatetpa.com",
    "leadName": "Elevate Medical Spa",
    "company": "Elevate Medical Spa",
    "city": "Tampa",
    "rating": 5,
    "subject": "quick question regarding Elevate Medical Spa VIP consultation booking workflow",
    "body": "Hi Elevate Medical Spa team,\n\nI was looking into premier medical spas and aesthetic clinics in Tampa and noticed Elevate Medical Spa has earned an outstanding 5★ patient reputation in Tampa, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for Elevate Medical Spa's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed Elevate Medical Spa has earned an outstanding 5★ patient reputation in Tampa, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries"
  },
  {
    "recipient": "info@sbspa.com",
    "leadName": "SB Health & Beauty Med Spa",
    "company": "SB Health & Beauty Med Spa",
    "city": "Tampa",
    "rating": 4.7,
    "subject": "quick question regarding SB Health & Beauty Med Spa aesthetic consultation booking workflow",
    "body": "Hi SB Health & Beauty Med Spa team,\n\nI was looking into premier medical spas and aesthetic clinics in Tampa and noticed SB Health & Beauty Med Spa has great reviews in Tampa, but your mobile website currently requires prospective patients to call or fill static contact forms rather than reserving aesthetic consultations instantly.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for SB Health & Beauty Med Spa's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed SB Health & Beauty Med Spa has great reviews in Tampa, but your mobile website currently requires prospective patients to call or fill static contact forms rather than reserving aesthetic consultations instantly"
  },
  {
    "recipient": "hello@bevelup.com",
    "leadName": "BevelUp Midtown",
    "company": "BevelUp Midtown",
    "city": "Tampa",
    "rating": 4.8,
    "subject": "quick question regarding BevelUp Midtown aesthetic consultation booking workflow",
    "body": "Hi BevelUp Midtown team,\n\nI was looking into premier medical spas and aesthetic clinics in Tampa and noticed BevelUp Midtown has great reviews in Tampa, but your mobile website currently requires prospective patients to call or fill static contact forms rather than reserving aesthetic consultations instantly.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for BevelUp Midtown's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed BevelUp Midtown has great reviews in Tampa, but your mobile website currently requires prospective patients to call or fill static contact forms rather than reserving aesthetic consultations instantly"
  },
  {
    "recipient": "info@zimedspa.com",
    "leadName": "Zi Medspa",
    "company": "Zi Medspa",
    "city": "Tampa",
    "rating": 5,
    "subject": "quick question regarding Zi Medspa VIP consultation booking workflow",
    "body": "Hi Zi Medspa team,\n\nI was looking into premier medical spas and aesthetic clinics in Tampa and noticed Zi Medspa has earned an outstanding 5★ patient reputation in Tampa, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for Zi Medspa's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed Zi Medspa has earned an outstanding 5★ patient reputation in Tampa, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries"
  },
  {
    "recipient": "info@rootstampa.com",
    "leadName": "Roots",
    "company": "Roots",
    "city": "Tampa",
    "rating": 4.8,
    "subject": "quick question regarding Roots aesthetic consultation booking workflow",
    "body": "Hi Roots team,\n\nI was looking into premier medical spas and aesthetic clinics in Tampa and noticed Roots has great reviews in Tampa, but your mobile website currently requires prospective patients to call or fill static contact forms rather than reserving aesthetic consultations instantly.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for Roots's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed Roots has great reviews in Tampa, but your mobile website currently requires prospective patients to call or fill static contact forms rather than reserving aesthetic consultations instantly"
  },
  {
    "recipient": "info@halosaltskinspa.com",
    "leadName": "HALO salt. skin. spa.",
    "company": "HALO salt. skin. spa.",
    "city": "Tampa",
    "rating": 4.9,
    "subject": "quick question regarding HALO salt. skin. spa. VIP consultation booking workflow",
    "body": "Hi HALO salt. skin. spa. team,\n\nI was looking into premier medical spas and aesthetic clinics in Tampa and noticed HALO salt. skin. spa. has earned an outstanding 4.9★ patient reputation in Tampa, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for HALO salt. skin. spa.'s patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed HALO salt. skin. spa. has earned an outstanding 4.9★ patient reputation in Tampa, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries"
  },
  {
    "recipient": "info@luxxmedspacenter.com",
    "leadName": "Luxx Medical Spa",
    "company": "Luxx Medical Spa",
    "city": "Tampa",
    "rating": 4.9,
    "subject": "quick question regarding Luxx Medical Spa VIP consultation booking workflow",
    "body": "Hi Luxx Medical Spa team,\n\nI was looking into premier medical spas and aesthetic clinics in Tampa and noticed Luxx Medical Spa has earned an outstanding 4.9★ patient reputation in Tampa, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for Luxx Medical Spa's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed Luxx Medical Spa has earned an outstanding 4.9★ patient reputation in Tampa, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries"
  },
  {
    "recipient": "info@omnilifemed.com",
    "leadName": "Omni Life Med+ Wellness",
    "company": "Omni Life Med+ Wellness",
    "city": "Tampa",
    "rating": 4.9,
    "subject": "quick question regarding Omni Life Med+ Wellness VIP consultation booking workflow",
    "body": "Hi Omni Life Med+ Wellness team,\n\nI was looking into premier medical spas and aesthetic clinics in Tampa and noticed Omni Life Med+ Wellness has earned an outstanding 4.9★ patient reputation in Tampa, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for Omni Life Med+ Wellness's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed Omni Life Med+ Wellness has earned an outstanding 4.9★ patient reputation in Tampa, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries"
  },
  {
    "recipient": "info@thewellnessclubtampa.com",
    "leadName": "The Wellness Club",
    "company": "The Wellness Club",
    "city": "Tampa",
    "rating": 4.9,
    "subject": "quick question regarding The Wellness Club VIP consultation booking workflow",
    "body": "Hi The Wellness Club team,\n\nI was looking into premier medical spas and aesthetic clinics in Tampa and noticed The Wellness Club has earned an outstanding 4.9★ patient reputation in Tampa, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for The Wellness Club's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed The Wellness Club has earned an outstanding 4.9★ patient reputation in Tampa, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries"
  },
  {
    "recipient": "inquiries@myhealthandglow.com",
    "leadName": "HEALTH + GLOW primary care",
    "company": "HEALTH + GLOW primary care",
    "city": "Tampa",
    "rating": 4.3,
    "subject": "quick question regarding HEALTH + GLOW primary care patient intake workflow",
    "body": "Hi HEALTH + GLOW primary care team,\n\nI was looking into premier medical spas and aesthetic clinics in Tampa and came across HEALTH + GLOW primary care while researching top-rated medical spas in Tampa and noticed several key opportunities to streamline your patient inquiry flow.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for HEALTH + GLOW primary care's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "came across HEALTH + GLOW primary care while researching top-rated medical spas in Tampa and noticed several key opportunities to streamline your patient inquiry flow"
  },
  {
    "recipient": "info@veincentertampa.com",
    "leadName": "Vein & Cosmetic Center of Tampa Bay",
    "company": "Vein & Cosmetic Center of Tampa Bay",
    "city": "Tampa",
    "rating": 4.9,
    "subject": "quick question regarding Vein & Cosmetic Center of Tampa Bay VIP consultation booking workflow",
    "body": "Hi Vein & Cosmetic Center of Tampa Bay team,\n\nI was looking into premier medical spas and aesthetic clinics in Tampa and noticed Vein & Cosmetic Center of Tampa Bay has earned an outstanding 4.9★ patient reputation in Tampa, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for Vein & Cosmetic Center of Tampa Bay's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed Vein & Cosmetic Center of Tampa Bay has earned an outstanding 4.9★ patient reputation in Tampa, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries"
  },
  {
    "recipient": "info@mysite.com",
    "leadName": "Wellness 360 Plus",
    "company": "Wellness 360 Plus",
    "city": "Tampa",
    "rating": 5,
    "subject": "quick question regarding Wellness 360 Plus VIP consultation booking workflow",
    "body": "Hi Wellness 360 Plus team,\n\nI was looking into premier medical spas and aesthetic clinics in Tampa and noticed Wellness 360 Plus has earned an outstanding 5★ patient reputation in Tampa, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for Wellness 360 Plus's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed Wellness 360 Plus has earned an outstanding 5★ patient reputation in Tampa, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries"
  },
  {
    "recipient": "revitaluxemedspa@gmail.com",
    "leadName": "Revita Luxe",
    "company": "Revita Luxe",
    "city": "Tampa",
    "rating": 4.9,
    "subject": "quick question regarding Revita Luxe VIP consultation booking workflow",
    "body": "Hi Revita Luxe team,\n\nI was looking into premier medical spas and aesthetic clinics in Tampa and noticed Revita Luxe has earned an outstanding 4.9★ patient reputation in Tampa, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for Revita Luxe's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed Revita Luxe has earned an outstanding 4.9★ patient reputation in Tampa, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries"
  },
  {
    "recipient": "support@liviamedspa.com",
    "leadName": "Livia Med Spa",
    "company": "Livia Med Spa",
    "city": "Tampa",
    "rating": 5,
    "subject": "quick question regarding Livia Med Spa VIP consultation booking workflow",
    "body": "Hi Livia Med Spa team,\n\nI was looking into premier medical spas and aesthetic clinics in Tampa and noticed Livia Med Spa has earned an outstanding 5★ patient reputation in Tampa, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for Livia Med Spa's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed Livia Med Spa has earned an outstanding 5★ patient reputation in Tampa, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries"
  },
  {
    "recipient": "contact@silklaserhair.com",
    "leadName": "Silk Med Spa",
    "company": "Silk Med Spa",
    "city": "Tampa",
    "rating": 5,
    "subject": "quick question regarding Silk Med Spa VIP consultation booking workflow",
    "body": "Hi Silk Med Spa team,\n\nI was looking into premier medical spas and aesthetic clinics in Tampa and noticed Silk Med Spa has earned an outstanding 5★ patient reputation in Tampa, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for Silk Med Spa's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed Silk Med Spa has earned an outstanding 5★ patient reputation in Tampa, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries"
  },
  {
    "recipient": "hello@elixiraestheticsmedspa.com",
    "leadName": "Elixir Aesthetics",
    "company": "Elixir Aesthetics",
    "city": "Tampa",
    "rating": 5,
    "subject": "quick question regarding Elixir Aesthetics VIP consultation booking workflow",
    "body": "Hi Elixir Aesthetics team,\n\nI was looking into premier medical spas and aesthetic clinics in Tampa and noticed Elixir Aesthetics has earned an outstanding 5★ patient reputation in Tampa, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for Elixir Aesthetics's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed Elixir Aesthetics has earned an outstanding 5★ patient reputation in Tampa, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries"
  },
  {
    "recipient": "tampa@tal-spa.com",
    "leadName": "The Aesthetics Lounge and Spa Tampa",
    "company": "The Aesthetics Lounge and Spa Tampa",
    "city": "Tampa",
    "rating": 5,
    "subject": "quick question regarding The Aesthetics Lounge and Spa Tampa VIP consultation booking workflow",
    "body": "Hi The Aesthetics Lounge and Spa Tampa team,\n\nI was looking into premier medical spas and aesthetic clinics in Tampa and noticed The Aesthetics Lounge and Spa Tampa has earned an outstanding 5★ patient reputation in Tampa, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for The Aesthetics Lounge and Spa Tampa's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed The Aesthetics Lounge and Spa Tampa has earned an outstanding 5★ patient reputation in Tampa, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries"
  },
  {
    "recipient": "hello@kayvitawellness.com",
    "leadName": "KayVita Wellness Spa",
    "company": "KayVita Wellness Spa",
    "city": "Tampa",
    "rating": 5,
    "subject": "quick question regarding KayVita Wellness Spa VIP consultation booking workflow",
    "body": "Hi KayVita Wellness Spa team,\n\nI was looking into premier medical spas and aesthetic clinics in Tampa and noticed KayVita Wellness Spa has earned an outstanding 5★ patient reputation in Tampa, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for KayVita Wellness Spa's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed KayVita Wellness Spa has earned an outstanding 5★ patient reputation in Tampa, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries"
  },
  {
    "recipient": "info@kiyanimedspa.com",
    "leadName": "Kiyani Aesthetics",
    "company": "Kiyani Aesthetics",
    "city": "Tampa",
    "rating": 5,
    "subject": "quick question regarding Kiyani Aesthetics VIP consultation booking workflow",
    "body": "Hi Kiyani Aesthetics team,\n\nI was looking into premier medical spas and aesthetic clinics in Tampa and noticed Kiyani Aesthetics has earned an outstanding 5★ patient reputation in Tampa, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries.\n\nWe specialize in high-converting, mobile-first web design and automated consultation booking systems built specifically for medical spas and cosmetic practices. Recent clients have increased inbound patient consultation bookings by over 38% in under 3 weeks while saving 15+ hours a week in front-desk scheduling.\n\nYou can see examples of our recent client builds and results here:\nhttps://www.ultimaspark.com/agency\n\nWould you be open to a quick 2-minute video walkthrough showing how this could work specifically for Kiyani Aesthetics's patient intake? Happy to share a practical example relevant to your team.\n\nBest regards,\nNadinho | UltimaSpark Agency",
    "hook": "noticed Kiyani Aesthetics has earned an outstanding 5★ patient reputation in Tampa, but your digital patient intake currently lacks an automated consultation booking assistant to capture after-hours inquiries"
  }
];

export async function GET() {
  return NextResponse.json({ messages: MESSAGES });
}
