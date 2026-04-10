# Mood application
Mood is a simple application that project team members can use to inform each other about their mood. This application run in browser. It basically serves three purposes:
1. Team members can inform their overall mood as a number between 1 to 5.
2. Team members can add some personal image or drawing to their badge to customize that week's mood.
3. The order how team members report their moods to the tool defines the order the team members demo their achievements in sprint review session.

At the first phase the application does not need to have any authentication. Everyone who has link to the application can use it. Idea is that it is as lightweight as possible and it runs in organization's internal network.
The application contains following views:
- Welcome view
- Mood selection view
- Team view
- Maintenance view

## Welcome view
When users navigate to the application URL, they should see a welcome screen that asks their name. User can type their name or select one of the previously used names. The view will get all the names used earlier in the application from the server and show them as quick selection option. When new team member joins for the first time to the Mood app, they can type their name and press Join-button. If name was already in use, the view should show text that "Name is already in use".

From here the app navigates to Mood selection view.

## Mood selection view
The Mood selection view shows 5 different moods options numbered from 1 to 5. They should be circular buttons and positioned on horizontal line. Right underneath the mood selections there is 500x500 pixels big white canvas. Some borders should be around it to show the the size of the canvas. Users can draw their Mood pictures by hand using the integrated drawing functionalities or press "Upload from device" button. Under the drawing tools there are Cancel and Continue-buttons.

Drawing tools:
- Free hand drawing.
- 3 Different brush sizes (10px, 20px, 40px)
- 2 Brush shapes. Round and square.
- 16 Different colors. Claude can pick good selection of colors that would enable drawing different things.

**Upload button**: When pressing the "Upload from device" button, we should open normal file selection dialog. Application should support PNG and JPEG formats. The selected image gets loaded and resized+cropped to the canvas. Users can then draw over it if they want.

**Cancel button**: Pressing Cancel-button will cancel the mood selection and go back to Welcome view.

**Continue button**: Pressing Continue-button will use the image from the canvas and the selected mood. The image from the canvas gets converted to JPEG. This information gets sent to the backend (submit operation) and the browser navigates to Team view.

## Team view
The Team view contains following information.
- Date. This can be edited and there is "Go to date" button that will go to that date when pressed.
- Name of the sprint. Anyone can edit it. Default is empty.
- An average mood calculated from the submitted mood ratings.

When user submits the Mood rating and image, it comes visible in this Team view as a rectangular badge. The application waits other users to join as well. As other users join, their Mood badges appear to the view and the view gets populated from left to right and up to down. The mood badges have little Heart-icon on their left-bottom corner with number of likes next to the heart icon. Other users can press the heart to give a like.

The mood banners have following information:
- Name,
- Mood rating selected in Mood selection view
- A mood image from MOod selection view
- Heart-icon that works as liking button.
- Number of likes.

The mood banners are sized to something like 80x160 px. It is possible to click the image and then it gets shown in full 500x500 px size. This image view has close button in top-right corner.

## Maintenance view
Maintenance view is kind of hidden view. User must know its URL to go there. From there it is possible to do following cleanup tasks.
- Remove daily moods that are older than certain date.
- Remove image data that are older than certain date.
- Remove users that haven't been using application since certain date.

Maintenance view should show a summary of number of users, number of mood badges, number of days with mood data. This can be very simple and minimalist.

# Technical requirements
The Mood application stores mood badges on daily basis. This means that when using "Go to date" button, it is possible to view the Mood badges of that day. Also the sprint name gets shown. If there are no entries saved to the Mood application on that day, an empty view is shown. Probably some "No Moods given this day" text is shown in the view.

No authentication needed.

At most 128 users can be created.

If same users tries to submit mood data again on same day, the previous data gets overwritten.

Team view updates dynamically when team members submit their moods.

Team view updates dynamically when joined team members are giving their likes. Some nice animations should be shown whenever someone likes team member's badge.

A database for storing the badge informations.
