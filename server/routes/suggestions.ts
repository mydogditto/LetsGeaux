const express = require("express");
import axios from "axios";
import { PrismaClient } from "@prisma/client";

const suggestionRouter = express.Router();
const prisma = new PrismaClient();
// .env api authorization information
const API_KEY = process.env.TRAVEL_ADVISOR_API_KEY;
// Api url options
// const options = {
//   method: 'GET',
//   url: `https://api.content.tripadvisor.com/api/v1/location/search?language=en&searchQuery=${query}&key=${API_KEY}`,
//   descriptionUrl: `https://api.content.tripadvisor.com/api/v1/location/${locationId}/details?language=en&currency=USD&key=${API_KEY}`,
//   imageUrl: `https://api.content.tripadvisor.com/api/v1/location/${locationId}/photos?language=en&key=${API_KEY}`,
//   headers: {accept: 'application/json'}
// };

/**
 * const getTripadvisorLocationIds = async (query: string = "restaurants", latLong: string = "30.001667%2C-90.092781") => {
  try {
    //  https://api.content.tripadvisor.com/api/v1/location/nearby_search?latLong=42.3455%2C-71.10767&key={API_KEY}&category=${query}&language=en;

    const list = await axios.get(`https://api.content.tripadvisor.com/api/v1/location/nearby_search?latLong=${latLong}&language=en&category=${query}&key=${API_KEY}`)
      let locations = [];
      const attractionList = list.data.data;
      for (let attraction of attractionList) {
        locations.push(attraction.location_id);
      }
      return locations;
    } catch (err) {

      console.error('failed to get ids', err);
    }
  }
 * 
 */

//  HELPERS //                                    enter lat long this way =>  42.3455,-71.10767
//This one queries tripadvisor to get the location ids needed for detailed information. these ids are returned in an array.
const getTripadvisorLocationIds = async (
  query: string = "restaurants",
  latLong: string = "30.001667%2C-90.092781"
) => {
  try {
    //  https://api.content.tripadvisor.com/api/v1/location/nearby_search?latLong=42.3455%2C-71.10767&key={API_KEY}&category=${query}&language=en;

    const list = await axios.get(
      `https://api.content.tripadvisor.com/api/v1/location/nearby_search?latLong=${latLong}&language=en&category=${query}&key=${API_KEY}`
    );
    let locations = [];
    const attractionList = list.data.data;
    for (let attraction of attractionList) {
      locations.push(attraction.location_id);
    }
    return locations;
  } catch (err) {
    console.error("failed to get ids", err);
  }
};

// This one queries trip advisor with an array of location ids and moves wanted info from the result to an object
const getTripadvisorDetailedEntries = async (locations: number[]) => {
  try {
    const detailedEntries = await locations.map(async (location) => {
      const detailedEntry = await axios.get(
        `https://api.content.tripadvisor.com/api/v1/location/${location}/details?language=en&currency=USD&key=${API_KEY}`
      );
      // const advisorImage = await axios.get(`https://api.content.tripadvisor.com/api/v1/location/${location}/photos?language=en&key=${API_KEY}`)
      // console.log('img', advisorImage);
      const {
        name,
        description,
        // hours,
        phone,
        address_obj,
        latitude,
        longitude,
        // price_level,
      } = detailedEntry.data;
      const locationQueryDetailedEntry = {
        title: name,
        description,
        // hours: hours.weekday_text,
        phoneNum: phone,
        // address: address_obj.address_string || "new orleans",
        latitude,
        longitude,
        address: address_obj.address_string,
        // cost: price_level.length,
      };
      // ----------------------this log worked perfectly ONE TIME! other than that, I just get a huge response object with message: too many requests in one of the lower objects
      // locationQueryDetailedEntry.image = advisorImage.data[0].images.large.url
      return locationQueryDetailedEntry;
    });
    const allDetailedEntries = Promise.all(detailedEntries);
    return allDetailedEntries;
  } catch (err) {
    console.error(err);
  }
};

// and finally, this one grabs the image url
const getTripAdvisorImage = (locationId) => {
  axios
    .get(
      `https://api.content.tripadvisor.com/api/v1/location/${locationId}/photos?language=en&key=${API_KEY}`
    )
    .then((setOfImages) => {
      // check here to see what comes back from this query..
      // console.log('set of images', setOfImages);
      // const { thumbnail } = setOfImages.data[0].images;
      // return thumbnail;
    });
};

// SEARCH flavored GET handling
suggestionRouter.get(`/search/:id`, async (req: any, res: any) => {
  const { id } = req.params;
  try {
    // Pull in current list of saved suggestions
    const savedSuggestions = await prisma.suggestion.findMany();
    // pull the interest name from this user
    const userInterest =
      await prisma.$queryRaw`SELECT name FROM interest WHERE id IN (SELECT interestId FROM userInterest WHERE userId = ${id})`;
    // console.log('fingers crossed for an interest:', userInterest[0])
    // if (userInterest[0]) {
    const { name } = userInterest[0];
    // console.log('parsed:', name);
    const locations: number[] = await getTripadvisorLocationIds(
      name.toLowerCase()
    )
      .then((locationArray) => {
        //     console.log('locationArray', locationArray);

        // const picture : string = await getTripAdvisorImage(locations)
        getTripadvisorDetailedEntries(locationArray).then((entries) => {
          Object.values(savedSuggestions).map((sugg) => {
            // console.log("db", sugg)
          });
          let newEntries = [];
          entries.forEach((entry) => {
            // THIS LINE SORTS THEM CORRECTLY! ATTACH A FILTER TO IT, GIVE IT A VARIABLE AND SHIP IT OUT

            if (
              Object.values(savedSuggestions).every((sugg) => {
                return sugg.title !== entry.title;
              })
            ) {
              newEntries.push(entry);
            }
          });
          //  const picture = getTripAdvisorImage(locationArray[0])
          //  console.log('sending out...', newEntries);
          res.status(200).send(newEntries);
        });
      })
      .catch((err) => {
        console.error("had a hard time", err);
        res.sendStatus(500);
      });
    // }
  } catch (err) {
    throw err;
  }
});
// adds to the vote upvote/downvote count of a suggestion
suggestionRouter.patch("/:id", async (req: any, res: any) => {
  const { id } = req.params;
  const values = () => {
    for (let key of req.body.data) {
      return req.body.data[key];
    }
  };

  try {
    const polarity = req.body;
    const setVote = await prisma.suggestion.update({
      where: { id: +id },
      data: {
        [polarity]: {
          increment: 1,
        },
      },
    });
  } catch (err) {
    console.error("unable to add vote", err);
    res.sendStatus(500);
  }
});

// GET request handling
suggestionRouter.get("/", async (req: any, res: any) => {
  try {
    const allSuggs = await prisma.suggestion.findMany();

    res.status(200).send(allSuggs);
  } catch (err: any) {
    console.error("FAIL!!", err);
    res.sendStatus(500);
  }
});

// POST requests from suggestions page (suggestion component)
suggestionRouter.post("/:userId", async (req: any, res: any) => {
  const { userId } = req.params;
  try {
    const newSuggestion = await prisma.suggestion.create(req.body);
    const { id } = newSuggestion;
    const wishObj = {
      data: {
        userId: +userId,
        suggestionId: id,
      },
    };
    const wishlistUserSuggestion =
      await prisma.userOnsuggestion.create(wishObj);
    res.sendStatus(201);
  } catch (err) {
    console.error("failed to add Suggestion", err);
    res.sendStatus(500);
  }
});

export default suggestionRouter;
