import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  category: number;
  thumbnail_url: string;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      // Load a specific food with extras based on routeParams id
      const response = await api.get(`/foods/${routeParams.id}`);

      const foodsData = {
        ...response.data,
        formattedPrice: formatValue(response.data.price),
      };

      const extrasData = foodsData.extras.map((extra: Extra) => {
        return {
          ...extra,
          quantity: 0,
        };
      });

      setFood(foodsData);

      setExtras(extrasData);

      try {
        await api.get(`/favorites/${routeParams.id}`);

        setIsFavorite(true);
      } catch {
        setIsFavorite(false);
      }
    }

    loadFood();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    // Increment extra quantity
    const extrasData = extras.map(extra => {
      if (extra.id === id) {
        return { ...extra, quantity: extra.quantity + 1 };
      }

      return extra;
    });

    setExtras(extrasData);
  }

  function handleDecrementExtra(id: number): void {
    // Decrement extra quantity
    const extrasData = extras.map(extra => {
      if (extra.id === id && extra.quantity > 0) {
        return { ...extra, quantity: extra.quantity - 1 };
      }

      return extra;
    });

    setExtras(extrasData);
  }

  function handleIncrementFood(): void {
    // Increment food quantity
    setFoodQuantity(foodQuantity + 1);
  }

  function handleDecrementFood(): void {
    // Decrement food quantity
    if (foodQuantity <= 1) return;

    setFoodQuantity(foodQuantity - 1);
  }

  const toggleFavorite = useCallback(() => {
    // Toggle if food is favorite or not
    if (isFavorite) {
      api.delete(`/favorites/${food.id}`);
    } else {
      api.post('/favorites', {
        id: food.id,
        name: food.name,
        description: food.description,
        price: food.price,
        thumbnail_url: food.thumbnail_url,
        formattedPrice: formatValue(food.price),
      });
    }

    setIsFavorite(!isFavorite);
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    // Calculate cartTotal
    const totalExtras = extras
      .map((extra: Extra) =>
        extra.quantity > 0 ? extra.value * extra.quantity : 0,
      )
      .reduce((accumulator, value) => {
        return accumulator + value;
      }, 0);

    return formatValue((totalExtras + Number(food.price)) * foodQuantity);
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    // Finish the order and save on the API
    const order = {
      product_id: food.id,
      name: food.name,
      description: food.description,
      price: food.price,
      category: food.category,
      thumbnail_url: food.thumbnail_url,
      quantity: foodQuantity,
      extras,
    };

    await api.post('/orders', order);

    navigation.goBack();
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
