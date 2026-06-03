import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { db } from '../config/db';
import { generateItineraryFromFile, generateItineraryFromPrompt } from '../config/gemini';

/**
 * Handle Trip Generation - support both booking file uploading (base64) and direct prompt building
 */
export async function createTrip(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User must be authenticated.' });
    }

    const { file, mimeType, fileName, customNotes, destination, durationDays, budgetLevel, startDate } = req.body;

    // Direct input type validation checks for NoSQL injection prevention & strict contract typing
    if (file && typeof file !== 'string') return res.status(400).json({ error: 'File data must be a valid base64 payload string.' });
    if (mimeType && typeof mimeType !== 'string') return res.status(400).json({ error: 'MimeType must be a string.' });
    if (fileName && typeof fileName !== 'string') return res.status(400).json({ error: 'FileName must be a string.' });
    if (customNotes && typeof customNotes !== 'string') return res.status(400).json({ error: 'Custom notes must be a string.' });
    if (destination && typeof destination !== 'string') return res.status(400).json({ error: 'Destination must be a string.' });
    if (budgetLevel && typeof budgetLevel !== 'string') return res.status(400).json({ error: 'BudgetLevel must be a string.' });
    if (startDate && typeof startDate !== 'string') return res.status(400).json({ error: 'StartDate must be a string.' });

    let parsedResult;

    if (file && mimeType) {
      // Clean up base64 prefix if present (e.g. data:application/pdf;base64,xxxx)
      let cleanBase64 = file;
      if (file.includes(';base64,')) {
        cleanBase64 = file.split(';base64,')[1];
      }

      console.log(`Processing uploaded document: ${fileName || 'Booking Document'} for user ${userId}`);
      
      // Call Gemini document parsing API
      parsedResult = await generateItineraryFromFile(cleanBase64, mimeType, customNotes);
    } else {
      // Validate prompt parameters
      if (!destination) {
        return res.status(400).json({ error: 'Please specify a destination city or booking document.' });
      }
      
      const duration = parseInt(durationDays, 10) || 3;
      if (duration < 1 || duration > 14) {
        return res.status(400).json({ error: 'Trip duration must be between 1 and 14 days.' });
      }

      console.log(`Generating prompt trip to ${destination} for user ${userId}`);

      // Call Gemini prompt generation API
      parsedResult = await generateItineraryFromPrompt(
        destination,
        duration,
        budgetLevel || 'Moderate',
        startDate,
        customNotes
      );
    }

    // Save to local database
    const savedTrip = await db.trips.create({
      userId,
      destination: parsedResult.destination || destination || 'Dream Trip',
      startDate: parsedResult.startDate || startDate || new Date().toISOString().split('T')[0],
      endDate: parsedResult.endDate || new Date().toISOString().split('T')[0],
      totalEstimatedBudget: parsedResult.totalEstimatedBudget || 1000,
      itinerary: parsedResult.itinerary || [],
      packingChecklist: parsedResult.packingChecklist || [],
      fileAttached: !!file,
      fileName: fileName || undefined
    });

    return res.status(201).json(savedTrip);

  } catch (error: any) {
    console.error('Error generating/saving travel itinerary:', error);
    return res.status(500).json({
      error: 'Failed to generate itinerary. Please try again.',
      details: error.message || 'An unexpected error occurred.'
    });
  }
}

/**
 * Fetch all trips for the authenticated user
 */
export async function getTripHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User must be authenticated.' });
    }

    const userTrips = await db.trips.findMany({ userId });
    return res.json(userTrips);
  } catch (error) {
    console.error('Error fetching trip history:', error);
    return res.status(500).json({ error: 'Failed to fetch historical itineraries.' });
  }
}

/**
 * Fetch a single trip details for public sharing (No authentication required)
 */
export async function getSharedTrip(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    if (typeof id !== 'string' || !id || id.trim() === '') {
      return res.status(400).json({ error: 'Invalid trip ID parameter format.' });
    }
    const trip = await db.trips.findById(id);

    if (!trip) {
      return res.status(404).json({ error: 'This itinerary does not exist or has been deleted.' });
    }

    return res.json(trip);
  } catch (error) {
    console.error('Error fetching shared trip:', error);
    return res.status(500).json({ error: 'Failed to fetch the requested itinerary.' });
  }
}

/**
 * Post an anonymous comment on a shared trip (No authentication required)
 */
export async function addSharedComment(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, comment } = req.body;

    if (typeof id !== 'string' || !id || id.trim() === '') {
      return res.status(400).json({ error: 'Invalid trip ID parameter format.' });
    }

    if (name && typeof name !== 'string') {
      return res.status(400).json({ error: 'Name must be a plain text string.' });
    }

    if (typeof comment !== 'string' || !comment || comment.trim() === '') {
      return res.status(400).json({ error: 'Comment body text must be a valid non-empty string.' });
    }

    const trip = await db.trips.findById(id);
    if (!trip) {
      return res.status(404).json({ error: 'This itinerary does not exist.' });
    }

    const newComment = {
      id: Math.random().toString(36).substring(2, 9),
      name: name && name.trim() !== '' ? name.trim() : 'Anonymous Globetrotter',
      comment: comment.trim(),
      createdAt: new Date().toISOString()
    };

    const updatedComments = [...(trip.comments || []), newComment];
    await db.trips.update(id, { comments: updatedComments });

    return res.json(newComment);
  } catch (error) {
    console.error('Error posting public feedback comment:', error);
    return res.status(500).json({ error: 'Failed to record your comment.' });
  }
}
