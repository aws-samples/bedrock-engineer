import React from 'react'
import { AgentIcon } from '@/types/agent-chat'
import {
  TbRobot,
  TbBrain,
  TbDatabase,
  TbSearch,
  TbTerminal2,
  TbBrandAws,
  TbCloud,
  TbServer,
  TbNetwork,
  TbBuildingBank,
  TbBooks,
  TbPencil,
  TbMessages,
  TbBulb,
  TbPuzzle,
  TbSettings,
  TbTool,
  TbTestPipe,
  TbBug,
  TbChartBar,
  TbLock,
  TbShield,
  TbWorld,
  TbHome,
  TbSofa,
  TbWashMachine,
  TbDeviceTv,
  TbPlant,
  TbCalendarEvent,
  TbCalendarTime,
  TbClock,
  TbCooker,
  TbMicrowave,
  TbToolsKitchen2,
  TbChefHat,
  TbSalad,
  TbMeat,
  TbBread,
  TbCoffee,
  TbEgg,
  TbHeartbeat,
  TbActivity,
  TbStethoscope,
  TbPill,
  TbVaccine,
  TbMedicalCross,
  TbFirstAidKit,
  TbWheelchair,
  TbWeight,
  TbRun,
  TbYoga,
  TbSwimming,
  TbSchool,
  TbBallpen,
  TbMath,
  TbAbacus,
  TbCalculator,
  TbLanguage,
  TbPalette,
  TbMusic,
  TbPlane,
  TbMap,
  TbCompass,
  TbCreditCard,
  TbReceipt,
  TbCoin,
  TbCash,
  TbCurrencyYen,
  TbShoppingCart,
  TbShoppingBag,
  TbGift,
  TbTruckDelivery,
  TbBuildingStore,
  TbCar,
  TbBike,
  TbTrain,
  TbBus,
  TbWalk,
  TbCameraPlus,
  TbMovie,
  TbDeviceGamepad2,
  TbDeviceTvOld,
  TbGuitarPick,
  TbMoodHappy,
  TbMoodKid,
  TbBabyCarriage,
  TbMoon,
  TbSun,
  TbCalendarStats,
  TbDog,
  TbCat,
  TbClothesRack
} from 'react-icons/tb'
import { FaCode, FaDocker, FaGithub, FaKeyboard, FaMicrochip, FaTerminal } from 'react-icons/fa'
import {
  MdDesignServices,
  MdArchitecture,
  MdSecurity,
  MdApi,
  MdFamilyRestroom,
  MdChildCare,
  MdPets,
  MdLocalLaundryService,
  MdOutdoorGrill,
  MdOutlineRestaurantMenu,
  MdShoppingBasket
} from 'react-icons/md'
import {
  BsLaptopFill,
  BsChatDots,
  BsKanban,
  BsGit,
  BsDiagram3,
  BsBook,
  BsBookshelf,
  BsJournalBookmark,
  BsHouseDoor,
  BsCalendar2Check,
  BsAlarm,
  BsClipboardPulse
} from 'react-icons/bs'
import { SiKubernetes, SiTerraform, SiGrafana, SiPrometheus } from 'react-icons/si'
import {
  GiCookingPot,
  GiNoodles,
  GiCupcake,
  GiOpenBook,
  GiTeacher,
  GiGraduateCap,
  GiCampingTent,
  GiMountainClimbing,
  GiTennisRacket
} from 'react-icons/gi'
import { IoFastFood, IoFitness } from 'react-icons/io5'
import {
  FaBaby,
  FaShoppingBag,
  FaWallet,
  FaMoneyBillWave,
  FaRunning,
  FaHospital,
  FaHiking,
  FaBicycle
} from 'react-icons/fa'
import { RiParentFill, RiHospitalFill, RiMentalHealthFill, RiRestaurantFill } from 'react-icons/ri'
import { BiSolidFirstAid, BiStore } from 'react-icons/bi'

export type AgentIconOption = {
  value: AgentIcon
  icon: React.ReactNode
  label: string
  category:
    | 'general'
    | 'development'
    | 'cloud'
    | 'devops'
    | 'security'
    | 'monitoring'
    | 'lifestyle'
    | 'health'
    | 'education'
    | 'travel'
    | 'food'
    | 'shopping'
  color?: string
}

export const AGENT_ICONS: AgentIconOption[] = [
  // General Purpose
  { value: 'robot', icon: <TbRobot />, label: 'Robot', category: 'general' },
  { value: 'brain', icon: <TbBrain />, label: 'Brain', category: 'general' },
  { value: 'chat', icon: <BsChatDots />, label: 'Chat', category: 'general' },
  { value: 'bulb', icon: <TbBulb />, label: 'Idea', category: 'general' },
  { value: 'books', icon: <TbBooks />, label: 'Documentation', category: 'general' },
  { value: 'pencil', icon: <TbPencil />, label: 'Editor', category: 'general' },
  { value: 'messages', icon: <TbMessages />, label: 'Communication', category: 'general' },
  { value: 'puzzle', icon: <TbPuzzle />, label: 'Problem Solving', category: 'general' },
  { value: 'world', icon: <TbWorld />, label: 'Global', category: 'general' },
  { value: 'happy', icon: <TbMoodHappy />, label: 'Happy', category: 'general' },
  { value: 'kid', icon: <TbMoodKid />, label: 'Kid', category: 'general' },
  { value: 'moon', icon: <TbMoon />, label: 'Night', category: 'general' },
  { value: 'sun', icon: <TbSun />, label: 'Day', category: 'general' },
  {
    value: 'calendar-stats',
    icon: <TbCalendarStats />,
    label: 'Calendar Stats',
    category: 'general'
  },

  // Development
  { value: 'code', icon: <FaCode />, label: 'Code', category: 'development' },
  { value: 'terminal', icon: <FaTerminal />, label: 'Terminal', category: 'development' },
  { value: 'terminal2', icon: <TbTerminal2 />, label: 'Command Line', category: 'development' },
  { value: 'keyboard', icon: <FaKeyboard />, label: 'Programming', category: 'development' },
  { value: 'bug', icon: <TbBug />, label: 'Debug', category: 'development' },
  { value: 'test', icon: <TbTestPipe />, label: 'Testing', category: 'development' },
  { value: 'api', icon: <MdApi />, label: 'API', category: 'development' },
  { value: 'database', icon: <TbDatabase />, label: 'Database', category: 'development' },
  {
    value: 'architecture',
    icon: <MdArchitecture />,
    label: 'Architecture',
    category: 'development'
  },
  { value: 'design', icon: <MdDesignServices />, label: 'Design', category: 'development' },
  { value: 'diagram', icon: <BsDiagram3 />, label: 'Diagram', category: 'development' },
  { value: 'settings', icon: <TbSettings />, label: 'Configuration', category: 'development' },
  { value: 'tool', icon: <TbTool />, label: 'Tools', category: 'development' },

  // Cloud & Infrastructure
  { value: 'aws', icon: <TbBrandAws />, label: 'AWS', category: 'cloud' },
  { value: 'cloud', icon: <TbCloud />, label: 'Cloud', category: 'cloud' },
  { value: 'server', icon: <TbServer />, label: 'Server', category: 'cloud' },
  { value: 'network', icon: <TbNetwork />, label: 'Network', category: 'cloud' },
  { value: 'laptop', icon: <BsLaptopFill />, label: 'Infrastructure', category: 'cloud' },
  { value: 'microchip', icon: <FaMicrochip />, label: 'Hardware', category: 'cloud' },

  // DevOps
  { value: 'docker', icon: <FaDocker />, label: 'Docker', category: 'devops' },
  { value: 'kubernetes', icon: <SiKubernetes />, label: 'Kubernetes', category: 'devops' },
  { value: 'terraform', icon: <SiTerraform />, label: 'Terraform', category: 'devops' },
  { value: 'git', icon: <BsGit />, label: 'Git', category: 'devops' },
  { value: 'github', icon: <FaGithub />, label: 'GitHub', category: 'devops' },
  { value: 'kanban', icon: <BsKanban />, label: 'Kanban', category: 'devops' },

  // Security
  { value: 'security', icon: <MdSecurity />, label: 'Security', category: 'security' },
  { value: 'lock', icon: <TbLock />, label: 'Authentication', category: 'security' },
  { value: 'shield', icon: <TbShield />, label: 'Protection', category: 'security' },
  { value: 'bank', icon: <TbBuildingBank />, label: 'Compliance', category: 'security' },

  // Monitoring & Analytics
  { value: 'search', icon: <TbSearch />, label: 'Search', category: 'monitoring' },
  { value: 'chart', icon: <TbChartBar />, label: 'Analytics', category: 'monitoring' },
  { value: 'grafana', icon: <SiGrafana />, label: 'Grafana', category: 'monitoring' },
  { value: 'prometheus', icon: <SiPrometheus />, label: 'Prometheus', category: 'monitoring' },

  // Lifestyle & Home
  { value: 'home', icon: <TbHome />, label: 'Home', category: 'lifestyle' },
  { value: 'house-door', icon: <BsHouseDoor />, label: 'House', category: 'lifestyle' },
  { value: 'sofa', icon: <TbSofa />, label: 'Living Room', category: 'lifestyle' },
  { value: 'laundry', icon: <MdLocalLaundryService />, label: 'Laundry', category: 'lifestyle' },
  {
    value: 'wash-machine',
    icon: <TbWashMachine />,
    label: 'Washing Machine',
    category: 'lifestyle'
  },
  { value: 'tv', icon: <TbDeviceTv />, label: 'Television', category: 'lifestyle' },
  { value: 'plant', icon: <TbPlant />, label: 'Plant', category: 'lifestyle' },
  {
    value: 'calendar-event',
    icon: <TbCalendarEvent />,
    label: 'Event Calendar',
    category: 'lifestyle'
  },
  {
    value: 'calendar-check',
    icon: <BsCalendar2Check />,
    label: 'Task Calendar',
    category: 'lifestyle'
  },
  { value: 'calendar-time', icon: <TbCalendarTime />, label: 'Schedule', category: 'lifestyle' },
  { value: 'clock', icon: <TbClock />, label: 'Clock', category: 'lifestyle' },
  { value: 'alarm', icon: <BsAlarm />, label: 'Alarm', category: 'lifestyle' },
  { value: 'family', icon: <MdFamilyRestroom />, label: 'Family', category: 'lifestyle' },
  { value: 'parent', icon: <RiParentFill />, label: 'Parenting', category: 'lifestyle' },
  { value: 'baby', icon: <FaBaby />, label: 'Baby', category: 'lifestyle' },
  {
    value: 'baby-carriage',
    icon: <TbBabyCarriage />,
    label: 'Baby Carriage',
    category: 'lifestyle'
  },
  { value: 'child', icon: <MdChildCare />, label: 'Child', category: 'lifestyle' },
  { value: 'dog', icon: <TbDog />, label: 'Dog', category: 'lifestyle' },
  { value: 'cat', icon: <TbCat />, label: 'Cat', category: 'lifestyle' },
  { value: 'pets', icon: <MdPets />, label: 'Pets', category: 'lifestyle' },
  { value: 'clothes', icon: <TbClothesRack />, label: 'Clothing', category: 'lifestyle' },

  // Health & Medical
  { value: 'heartbeat', icon: <TbHeartbeat />, label: 'Heart Rate', category: 'health' },
  { value: 'activity', icon: <TbActivity />, label: 'Health Activity', category: 'health' },
  { value: 'stethoscope', icon: <TbStethoscope />, label: 'Doctor', category: 'health' },
  { value: 'pill', icon: <TbPill />, label: 'Medication', category: 'health' },
  { value: 'vaccine', icon: <TbVaccine />, label: 'Vaccination', category: 'health' },
  { value: 'medical-cross', icon: <TbMedicalCross />, label: 'Medical', category: 'health' },
  { value: 'first-aid', icon: <TbFirstAidKit />, label: 'First Aid', category: 'health' },
  { value: 'first-aid-box', icon: <BiSolidFirstAid />, label: 'First Aid Kit', category: 'health' },
  { value: 'hospital', icon: <FaHospital />, label: 'Hospital', category: 'health' },
  { value: 'hospital-fill', icon: <RiHospitalFill />, label: 'Medical Center', category: 'health' },
  { value: 'wheelchair', icon: <TbWheelchair />, label: 'Accessibility', category: 'health' },
  { value: 'weight', icon: <TbWeight />, label: 'Weight', category: 'health' },
  { value: 'run', icon: <TbRun />, label: 'Running', category: 'health' },
  { value: 'running', icon: <FaRunning />, label: 'Exercise', category: 'health' },
  { value: 'yoga', icon: <TbYoga />, label: 'Yoga', category: 'health' },
  { value: 'fitness', icon: <IoFitness />, label: 'Fitness', category: 'health' },
  { value: 'swimming', icon: <TbSwimming />, label: 'Swimming', category: 'health' },
  {
    value: 'clipboard-pulse',
    icon: <BsClipboardPulse />,
    label: 'Health Data',
    category: 'health'
  },
  {
    value: 'mental-health',
    icon: <RiMentalHealthFill />,
    label: 'Mental Health',
    category: 'health'
  },

  // Education & Learning
  { value: 'school', icon: <TbSchool />, label: 'School', category: 'education' },
  { value: 'ballpen', icon: <TbBallpen />, label: 'Writing', category: 'education' },
  { value: 'book', icon: <BsBook />, label: 'Book', category: 'education' },
  { value: 'bookshelf', icon: <BsBookshelf />, label: 'Library', category: 'education' },
  { value: 'journal', icon: <BsJournalBookmark />, label: 'Journal', category: 'education' },
  { value: 'math', icon: <TbMath />, label: 'Mathematics', category: 'education' },
  { value: 'abacus', icon: <TbAbacus />, label: 'Calculation', category: 'education' },
  { value: 'calculator', icon: <TbCalculator />, label: 'Calculator', category: 'education' },
  { value: 'language', icon: <TbLanguage />, label: 'Languages', category: 'education' },
  { value: 'palette', icon: <TbPalette />, label: 'Art', category: 'education' },
  { value: 'music', icon: <TbMusic />, label: 'Music Education', category: 'education' },
  { value: 'open-book', icon: <GiOpenBook />, label: 'Study', category: 'education' },
  { value: 'teacher', icon: <GiTeacher />, label: 'Teaching', category: 'education' },
  { value: 'graduate', icon: <GiGraduateCap />, label: 'Graduation', category: 'education' },

  // Travel & Hobbies
  { value: 'plane', icon: <TbPlane />, label: 'Air Travel', category: 'travel' },
  { value: 'map', icon: <TbMap />, label: 'Map', category: 'travel' },
  { value: 'compass', icon: <TbCompass />, label: 'Navigation', category: 'travel' },
  { value: 'camping', icon: <GiCampingTent />, label: 'Camping', category: 'travel' },
  { value: 'mountain', icon: <GiMountainClimbing />, label: 'Mountaineering', category: 'travel' },
  { value: 'hiking', icon: <FaHiking />, label: 'Hiking', category: 'travel' },
  { value: 'car', icon: <TbCar />, label: 'Car', category: 'travel' },
  { value: 'bicycle', icon: <FaBicycle />, label: 'Cycling', category: 'travel' },
  { value: 'bike', icon: <TbBike />, label: 'Bike', category: 'travel' },
  { value: 'train', icon: <TbTrain />, label: 'Train', category: 'travel' },
  { value: 'bus', icon: <TbBus />, label: 'Bus', category: 'travel' },
  { value: 'walk', icon: <TbWalk />, label: 'Walking', category: 'travel' },
  { value: 'camera', icon: <TbCameraPlus />, label: 'Photography', category: 'travel' },
  { value: 'movie', icon: <TbMovie />, label: 'Movies', category: 'travel' },
  { value: 'gamepad', icon: <TbDeviceGamepad2 />, label: 'Gaming', category: 'travel' },
  { value: 'tv-old', icon: <TbDeviceTvOld />, label: 'Entertainment', category: 'travel' },
  { value: 'guitar', icon: <TbGuitarPick />, label: 'Music', category: 'travel' },
  { value: 'tennis', icon: <GiTennisRacket />, label: 'Sports', category: 'travel' },

  // Food & Cooking
  { value: 'cooker', icon: <TbCooker />, label: 'Cooking', category: 'food' },
  { value: 'microwave', icon: <TbMicrowave />, label: 'Microwave', category: 'food' },
  { value: 'kitchen', icon: <TbToolsKitchen2 />, label: 'Kitchen Tools', category: 'food' },
  { value: 'chef', icon: <TbChefHat />, label: 'Chef', category: 'food' },
  { value: 'cooking-pot', icon: <GiCookingPot />, label: 'Pot Cooking', category: 'food' },
  { value: 'grill', icon: <MdOutdoorGrill />, label: 'BBQ & Grill', category: 'food' },
  { value: 'fast-food', icon: <IoFastFood />, label: 'Fast Food', category: 'food' },
  { value: 'restaurant', icon: <RiRestaurantFill />, label: 'Restaurant', category: 'food' },
  { value: 'menu', icon: <MdOutlineRestaurantMenu />, label: 'Menu', category: 'food' },
  { value: 'salad', icon: <TbSalad />, label: 'Healthy Food', category: 'food' },
  { value: 'meat', icon: <TbMeat />, label: 'Meat', category: 'food' },
  { value: 'bread', icon: <TbBread />, label: 'Bakery', category: 'food' },
  { value: 'coffee', icon: <TbCoffee />, label: 'Coffee', category: 'food' },
  { value: 'egg', icon: <TbEgg />, label: 'Breakfast', category: 'food' },
  { value: 'noodles', icon: <GiNoodles />, label: 'Noodles', category: 'food' },
  { value: 'cupcake', icon: <GiCupcake />, label: 'Dessert', category: 'food' },

  // Shopping & Finance
  { value: 'credit-card', icon: <TbCreditCard />, label: 'Credit Card', category: 'shopping' },
  { value: 'receipt', icon: <TbReceipt />, label: 'Receipt', category: 'shopping' },
  { value: 'coin', icon: <TbCoin />, label: 'Savings', category: 'shopping' },
  { value: 'cash', icon: <TbCash />, label: 'Cash', category: 'shopping' },
  { value: 'currency-yen', icon: <TbCurrencyYen />, label: 'Japanese Yen', category: 'shopping' },
  { value: 'wallet', icon: <FaWallet />, label: 'Wallet', category: 'shopping' },
  { value: 'money', icon: <FaMoneyBillWave />, label: 'Money', category: 'shopping' },
  {
    value: 'shopping-cart',
    icon: <TbShoppingCart />,
    label: 'Shopping Cart',
    category: 'shopping'
  },
  { value: 'shopping-bag', icon: <TbShoppingBag />, label: 'Shopping', category: 'shopping' },
  {
    value: 'shopping-bag-solid',
    icon: <FaShoppingBag />,
    label: 'Shopping Bag',
    category: 'shopping'
  },
  {
    value: 'shopping-basket',
    icon: <MdShoppingBasket />,
    label: 'Shopping Basket',
    category: 'shopping'
  },
  { value: 'gift', icon: <TbGift />, label: 'Gift', category: 'shopping' },
  { value: 'truck', icon: <TbTruckDelivery />, label: 'Delivery', category: 'shopping' },
  { value: 'store', icon: <TbBuildingStore />, label: 'Store', category: 'shopping' },
  { value: 'shop', icon: <BiStore />, label: 'Shop', category: 'shopping' }
]

export const getIconByValue = (value: AgentIcon, color?: string): React.ReactNode => {
  const option = AGENT_ICONS.find((opt) => opt.value === value)
  const icon = option?.icon || <TbRobot />
  if (color) {
    return React.cloneElement(icon as React.ReactElement, { style: { color } })
  }
  return icon
}

export const getIconsByCategory = (category: AgentIconOption['category']): AgentIconOption[] => {
  return AGENT_ICONS.filter((icon) => icon.category === category)
}
