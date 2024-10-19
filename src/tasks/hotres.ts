import { CombatStrategy } from "grimoire-kolmafia";
import {
  buy,
  cliExecute,
  create,
  drink,
  Effect,
  getWorkshed,
  inebrietyLimit,
  myInebriety,
  print,
  use,
  useFamiliar,
  useSkill,
  visitUrl,
} from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $location,
  $monster,
  $skill,
  CombatLoversLocket,
  CommunityService,
  get,
  have,
  TrainSet,
  uneffect,
} from "libram";
import {
  canConfigure,
  Cycle,
  setConfiguration,
  Station,
} from "libram/dist/resources/2022/TrainSet";
import Macro from "../combat";
import { Quest } from "../engine/task";
import { chooseFamiliar } from "../familiars";
import {
  handleCustomPulls,
  logTestSetup,
  mainStatStr,
  tryAcquiringEffect,
  useParkaSpit,
  wishFor,
} from "../lib";
import { baseOutfit, sugarItemsAboutToBreak } from "../outfit";

const hotTestMaximizerString = "hot res";

export const HotResQuest: Quest = {
  name: "Hot Res",
  completed: () => CommunityService.HotRes.isDone(),
  tasks: [
    {
      name: "Free Run for Hot Res",
      completed: () =>
        have($effect`Frozen`) ||
        have($effect`Double Frozen`) ||
        getWorkshed() !== $item`model train set`,
      do: $location`The Dire Warren`,
      combat: new CombatStrategy().macro(
        Macro.trySkill($skill`Spring Away`)
          .trySkill($skill`Reflex Hammer`)
          .trySkill($skill`Snokebomb`)
          .abort(),
      ),
      outfit: () => ({
        ...baseOutfit(),
        acc1: $item`Lil' Doctor™ bag`,
      }),
      limit: { tries: 2 },
    },
    {
      name: "Configure Trainset",
      completed: () =>
        !(getWorkshed() === $item`model train set`) ||
        !canConfigure() ||
        have($effect`Double Frozen`),
      do: (): void => {
        const offset = get("trainsetPosition") % 8;
        const newStations: TrainSet.Station[] = [];
        const statStation: Station = {
          Muscle: Station.BRAWN_SILO,
          Mysticality: Station.BRAIN_SILO,
          Moxie: Station.GROIN_SILO,
        }[mainStatStr];
        const stations = [
          Station.COAL_HOPPER, // double hot resist
          Station.TOWER_FROZEN, // hot resist
          Station.GAIN_MEAT, // meat
          Station.TOWER_FIZZY, // mp regen
          statStation, // main stats
          Station.VIEWING_PLATFORM, // all stats
          Station.WATER_BRIDGE, // +ML
          Station.CANDY_FACTORY, // candies
        ] as Cycle;
        for (let i = 0; i < 8; i++) {
          const newPos = (i + offset) % 8;
          newStations[newPos] = stations[i];
        }
        setConfiguration(newStations as Cycle);
      },
      limit: { tries: 1 },
    },
    {
      name: "Free Run for Hot Res Continued",
      after: ["Configure Trainset"],
      completed: () => have($effect`Double Frozen`) || getWorkshed() !== $item`model train set`,
      do: $location`The Dire Warren`,
      combat: new CombatStrategy().macro(
        Macro.trySkill($skill`Spring Away`)
          .trySkill($skill`Reflex Hammer`)
          .trySkill($skill`Snokebomb`)
          .abort(),
      ),
      outfit: () => ({
        ...baseOutfit(),
        acc1: $item`Lil' Doctor™ bag`,
      }),
      limit: { tries: 2 },
    },
    // {
    //   name: "Map for BOFA Hot Res",
    //   completed: () =>
    //     myClass() != $class`Seal Clubber` ||
    //     !have($skill`Map the Monsters`) ||
    //     get("_monstersMapped") >= 3 ||
    //     have($effect`Antiantifrozen`),
    //   do: () => mapMonster($location`Madness Bakery`, $monster`dinner troll`),
    //   combat: new CombatStrategy().macro(
    //     Macro.trySkill($skill`Darts: Aim for the Bullseye`)
    //       .trySkill($skill`Chest X-Ray`)
    //       .trySkill($skill`Shattering Punch`)
    //       .attack(),
    //   ),
    //   outfit: () => ({
    //     ...baseOutfit(false),
    //     acc1:
    //       have($item`Everfull Dart Holster`) && !have($effect`Everything Looks Red`)
    //         ? $item`Everfull Dart Holster`
    //         : undefined,
    //     acc2: $item`Lil' Doctor™ bag`,
    //     modifier: `${baseOutfit().modifier}, -equip miniature crystal ball, -equip backup camera, -equip Kramco Sausage-o-Matic™`,
    //   }),
    //   limit: { tries: 1 },
    // },
    {
      name: "Reminisce Factory Worker (female)",
      prepare: (): void => {
        if (useParkaSpit) {
          cliExecute("parka dilophosaur");
        } else if (!have($item`yellow rocket`) && !have($effect`Everything Looks Yellow`)) {
          buy($item`yellow rocket`, 1);
        }
      },
      completed: () =>
        CombatLoversLocket.monstersReminisced().includes($monster`factory worker (female)`) ||
        !CombatLoversLocket.availableLocketMonsters().includes($monster`factory worker (female)`) ||
        get("instant_saveLocketFactoryWorker", false),
      do: () => CombatLoversLocket.reminisce($monster`factory worker (female)`),
      outfit: () => ({
        back: $item`vampyric cloake`,
        shirt: $item`Jurassic Parka`,
        weapon: $item`Fourth of May Cosplay Saber`,
        offhand: have($skill`Double-Fisted Skull Smashing`)
          ? $item`industrial fire extinguisher`
          : $item`Roman Candelabra`,
        familiar: chooseFamiliar(false),
        modifier: "Item Drop",
        avoid: sugarItemsAboutToBreak(),
      }),
      choices: { 1387: 3 },
      combat: new CombatStrategy().macro(
        Macro.trySkill($skill`Become a Cloud of Mist`)
          .trySkill($skill`Fire Extinguisher: Foam Yourself`)
          .trySkill($skill`Use the Force`)
          .trySkill($skill`Shocking Lick`)
          .if_(
            "!haseffect Everything Looks Yellow",
            Macro.externalIf(useParkaSpit, Macro.trySkill($skill`Spit jurassic acid`))
              .trySkill($skill`Blow the Yellow Candle!`)
              .tryItem($item`yellow rocket`),
          )
          .default(),
      ),
      limit: { tries: 1 },
    },
    {
      name: "Grab Foam Suit",
      completed: () =>
        have($effect`Fireproof Foam Suit`) ||
        !have($item`Fourth of May Cosplay Saber`) ||
        get("_saberForceUses") >= 5 ||
        !have($item`industrial fire extinguisher`) ||
        !have($skill`Double-Fisted Skull Smashing`),
      do: $location`The Dire Warren`,
      outfit: {
        back: $item`vampyric cloake`,
        weapon: $item`Fourth of May Cosplay Saber`,
        offhand: $item`industrial fire extinguisher`,
        familiar: $familiar`Cookbookbat`,
        modifier: "Item Drop",
      },
      choices: { 1387: 3 },
      combat: new CombatStrategy().macro(
        Macro.trySkill($skill`Become a Cloud of Mist`)
          .skill($skill`Fire Extinguisher: Foam Yourself`)
          .skill($skill`Use the Force`)
          .abort(),
      ),
      limit: { tries: 1 },
    },
    {
      name: "Drink Boris Beer",
      completed: () =>
        have($effect`Beery Cool`) ||
        ((!have($item`bowl of cottage cheese`) || !have($item`Yeast of Boris`)) &&
          !have($item`Boris's beer`)) ||
        myInebriety() >= inebrietyLimit() ||
        get("instant_saveBorisBeer", false),
      do: (): void => {
        tryAcquiringEffect($effect`Ode to Booze`);
        if (have($item`Yeast of Boris`) && have($item`bowl of cottage cheese`))
          create($item`Boris's beer`, 1);
        if (have($item`Boris's beer`)) drink($item`Boris's beer`, 1);
        uneffect($effect`Ode to Booze`);
      },
      limit: { tries: 1 },
    },
    {
      name: "Horsery",
      completed: () => get("_horsery") === "pale horse" || !get("horseryAvailable"),
      do: () => cliExecute("horsery pale"),
      limit: { tries: 1 },
    },
    {
      name: "Metal Meteoroid",
      completed: () => !have($item`metal meteoroid`) || have($item`meteorite guard`),
      do: () => create($item`meteorite guard`, 1),
      limit: { tries: 1 },
    },
    {
      name: "Grubby Wool Scarf",
      completed: () => !have($item`grubby wool`) || have($item`grubby wool scarf`),
      do: () => create($item`grubby wool scarf`, 1),
      limit: { tries: 1 },
    },
    {
      name: "Favorite Bird (Hot Res)",
      completed: () =>
        !have($skill`Visit your Favorite Bird`) ||
        get("_favoriteBirdVisited") ||
        !get("yourFavoriteBirdMods").includes("Hot Resistance") ||
        get("instant_saveFavoriteBird", false),
      do: () => useSkill($skill`Visit your Favorite Bird`),
      limit: { tries: 1 },
    },
    {
      name: "Embers-Only Jacket",
      completed: () =>
        !have($item`Sept-Ember Censer`) ||
        have($item`embers-only jacket`) ||
        get("instant_saveEmbers", false) ||
        get("availableSeptEmbers") === 0,
      do: () =>
        visitUrl("shop.php?whichshop=september&action=buyitem&quantity=1&whichrow=1515&pwd"), // Grab Jacket
      limit: { tries: 1 },
    },
    {
      name: "Test",
      prepare: (): void => {
        cliExecute("retrocape vampire hold");
        if (get("parkaMode") !== "pterodactyl") cliExecute("parka pterodactyl");
        if (
          get("_kgbClicksUsed") < 22 &&
          have($item`Kremlin's Greatest Briefcase`) &&
          !get("instant_saveKGBClicks", false)
        )
          cliExecute("Briefcase e hot");

        const usefulEffects: Effect[] = [
          $effect`Amazing`,
          $effect`Astral Shell`,
          $effect`Egged On`,
          $effect`Elemental Saucesphere`,
          $effect`Feeling Peaceful`,
          $effect`Hot-Headed`,
          // $effect`Rainbowolin`,
          $effect`Rainbow Vaccine`,

          // Famwt Buffs
          $effect`Blood Bond`,
          $effect`Empathy`,
          $effect`Leash of Linguini`,
        ];
        usefulEffects.forEach((ef) => tryAcquiringEffect(ef, true));
        handleCustomPulls("instant_hotTestPulls", hotTestMaximizerString);

        if (
          CommunityService.HotRes.actualCost() >= 4 &&
          (have($item`mini kiwi`, 3) || have($item`mini kiwi illicit antibiotic`))
        ) {
          if (!have($item`mini kiwi illicit antibiotic`) && !have($effect`Incredibly Healthy`))
            create($item`mini kiwi illicit antibiotic`, 1);
          tryAcquiringEffect($effect`Incredibly Healthy`);
        }

        // If it saves us >= 6 turns, try using a wish
        if (CommunityService.HotRes.actualCost() >= 7) wishFor($effect`Fireproof Lips`);

        if (
          CommunityService.HotRes.actualCost() > 1 &&
          have($skill`Summon Clip Art`) &&
          !get("instant_saveClipArt", false) &&
          have($familiar`Exotic Parrot`) &&
          !have($item`cracker`)
        ) {
          if (!have($item`box of Familiar Jacks`)) create($item`box of Familiar Jacks`, 1);
          useFamiliar($familiar`Exotic Parrot`);
          use($item`box of Familiar Jacks`, 1);
        }
      },
      completed: () => CommunityService.HotRes.isDone(),
      do: (): void => {
        const maxTurns = get("instant_hotTestTurnLimit", 35);
        const testTurns = CommunityService.HotRes.actualCost();
        if (testTurns > maxTurns) {
          print(`Expected to take ${testTurns}, which is more than ${maxTurns}.`, "red");
          print("Either there was a bug, or you are under-prepared for this test", "red");
          print("Manually complete the test if you think this is fine.", "red");
          print(
            "You may also increase the turn limit by typing 'set instant_hotTestTurnLimit=<new limit>'",
            "red",
          );
        }
        CommunityService.HotRes.run(() => logTestSetup(CommunityService.HotRes), maxTurns);
      },
      outfit: {
        modifier: hotTestMaximizerString,
        familiar: $familiar`Exotic Parrot`,
      },
      post: (): void => {
        if (get("_horsery") === "pale horse") cliExecute("horsery dark");
      },
      limit: { tries: 1 },
    },
  ],
};
