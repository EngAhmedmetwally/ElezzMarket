# **App Name**: ElEzz Market - Sales Automation

## Core Features:

- User and Role Management: Admin users can manage system users, assign roles (Admin, Operations, Moderator, Courier), define and enforce a granular permission matrix, and handle user states like creation, editing, and disabling.
- Order Entry and Tracking: A user-friendly form for creating new orders, capturing customer details, product items, and calculated totals. Features automatic timestamping, data locking after creation for most fields, and allows Operations/Courier to update order status.
- Smart Commission System: A comprehensive system to define tiered commission rules per order count (global or user-specific), apply booking commissions automatically upon order creation, and add delivery commissions only when an order is 'Delivered'. Monthly summaries per moderator are generated.
- Reporting & Analytics Dashboard: An interactive dashboard providing key performance indicators like orders by status, total sales, average order value, top zonings, and top moderators. Includes detailed customer, moderator, and courier-specific reports with data export capabilities (CSV/Excel).
- Returns & No Answer Tracker: A dedicated page to monitor and manage orders with 'Returned' or 'No Answer' statuses. Provides filtering options (date range, zoning, moderator, courier) and fields for follow-up notes.
- Multi-language (RTL/LTR) Support: User interface provides full support for Arabic (RTL) and English (LTR) layouts with an easily accessible language toggle.
- Dynamic Invoice Printing: Generate and print formatted PDF invoices directly from the order details screen, supporting standard A4 size and optional 80mm thermal receipt printing, tailored with branding and full order specifics.

## Style Guidelines:

- A modern and professional primary color palette centered around a deep blue-purple for authority and clarity (Primary: #44198E, Background: #F4F1F7). An analogous, vibrant blue serves as the accent color for interactive elements and calls to action (Accent: #4666ED).
- Body and headline font: 'Inter' (sans-serif) for its modern, neutral, and highly readable characteristics, ideal for data-dense dashboards and mobile-first responsiveness.
- Leverage Material Design icons, providing a clean, recognizable, and scalable set of symbols for intuitive navigation and data representation.  No images will be used for a clean and fast experience.
- Implement a 'Material Design' inspired layout featuring excellent mobile-first responsiveness. All screens and tables will be optimized for mobile use. Transitioning between a desktop sidebar navigation and mobile bottom navigation for optimal user experience across devices. Data tables will include robust sort, filter, and pagination functionalities.
- Support both dark mode and light mode, automatically adapting to the user's system preferences for optimal viewing experience.
- Integrate subtle functional animations such as skeleton loading states for content, clear empty state indicators, and 'toast' notifications for immediate user feedback on actions, adhering to Material Design principles. All animations will be optimized for speed and smoothness.