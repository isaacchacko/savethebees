import IntroActions from "@/components/IntroActions";

export const metadata = {
  title: "transit control — isaacchacko.com",
  description: "The map behind this site is a tiny city builder.",
};

// the intro page: the pitch, before the player picks the game page or the fp page
export default function IntroPage() {
  return (
    <>
      <p>
        houses keep popping up across the map, and everyone in them wants to
        get somewhere: to their friends, to the park.
      </p>
      <p>
        you&rsquo;re the planner. each day you get a few stations, parks and
        tunnels, and a limited supply of rail. connect the town and score
        enough by sundown to make it to tomorrow.
      </p>
      <p>
        and every other day the land fights back: a flood or a landslide
        tears through your rail, so build to rebuild.
      </p>
      <IntroActions />
    </>
  );
}
