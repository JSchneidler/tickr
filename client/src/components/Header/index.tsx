import { useMemo, useState } from "react";
import {
  Group,
  Button,
  Modal,
  PasswordInput,
  TextInput,
  ActionIcon,
  useMantineColorScheme,
  useComputedColorScheme,
  Text,
  Stack,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { TbSunHigh, TbMoon } from "react-icons/tb";
import { ReactSVG } from "react-svg";

import TickrLogo from "../../assets/tickr-logo.svg";
import {
  useLogoutMutation,
  useLoginMutation,
  useRegisterMutation,
  useMeQuery,
} from "../../store/api";
import { usePortfolioValue } from "../../hooks/usePortfolioValue";
import { useAppSelector } from "../../store/hooks";
import { selectMyRank } from "../../store/leaderboard";
import Dollars from "../Dollars";
import Gain from "../Gain";
import Leaderboard, { rankDisplay } from "../Leaderboard";

import "./Header.css";

interface AuthFields {
  email: string;
  name?: string;
  password: string;
}

function Header() {
  const { data: user } = useMeQuery();
  const [register] = useRegisterMutation();
  const [login] = useLoginMutation();
  const [logout] = useLogoutMutation();

  const portfolioValue = usePortfolioValue();
  const myRankEntry = useAppSelector(selectMyRank(user?.id));

  const [opened, setOpened] = useState(false);
  const [isRegistration, setIsRegistration] = useState(false);
  const [leaderboardOpened, setLeaderboardOpened] = useState(false);

  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("dark", {
    getInitialValueInEffect: true,
  });

  const form = useForm<AuthFields>({
    mode: "uncontrolled",
    initialValues: {
      email: "",
      name: undefined,
      password: "",
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? undefined : "Invalid email"),
    },
  });

  const onFormSubmit = useMemo(
    () =>
      form.onSubmit((values) => {
        // @ts-expect-error: values.name is being checked
        if (isRegistration && values.name) void register({ ...values });
        else if (!isRegistration) void login({ ...values });

        setOpened(false);
        form.reset();
      }),
    [form, isRegistration, login, register],
  );

  function onRegisterClick() {
    setIsRegistration(true);
    setOpened(true);
  }

  function onLoginClick() {
    setIsRegistration(false);
    setOpened(true);
  }

  return (
    <>
      <Leaderboard
        opened={leaderboardOpened}
        onClose={() => setLeaderboardOpened(false)}
      />
      <Modal
        opened={opened}
        title={isRegistration ? "Register" : "Login"}
        centered
        onClose={() => {
          setOpened(false);
        }}
      >
        <form onSubmit={onFormSubmit}>
          <TextInput
            required
            label="Email"
            placeholder="your@email.com"
            key={form.key("email")}
            {...form.getInputProps("email")}
          />
          {isRegistration && (
            <TextInput
              required
              label="Name"
              placeholder="Doug Smith"
              key={form.key("name")}
              {...form.getInputProps("name")}
            />
          )}
          <PasswordInput
            required
            label="Password"
            key={form.key("password")}
            {...form.getInputProps("password")}
          />
          <Group justify="flex-end" mt="md">
            <Button type="submit">Submit</Button>
          </Group>
        </form>
      </Modal>
      <Group justify="space-between" align="center" h="100%" p={5}>
        <ReactSVG src={TickrLogo} id="logo" className={computedColorScheme} />
        <Group>
          {user && (
            <>
              <Stack gap={0} align="flex-end">
                <Text size="xs" c="dimmed">
                  Cash
                </Text>
                <Dollars value={user.balance} />
              </Stack>
              {portfolioValue && (
                <>
                  <Stack gap={0} align="flex-end">
                    <Text size="xs" c="dimmed">
                      Portfolio
                    </Text>
                    <Dollars value={portfolioValue.value} />
                  </Stack>
                  <Gain
                    change={portfolioValue.change}
                    changePercent={portfolioValue.changePercent}
                  />
                </>
              )}
              {myRankEntry && (
                <Button
                  variant="subtle"
                  onClick={() => setLeaderboardOpened(true)}
                  title="View leaderboard"
                >
                  {rankDisplay(myRankEntry.rank)}
                </Button>
              )}
              <Button
                variant="subtle"
                onClick={() => {
                  void logout();
                }}
              >
                Log out
              </Button>
            </>
          )}
          {!user && (
            <div>
              <Button onClick={onRegisterClick}>Register</Button>
              <Button onClick={onLoginClick} ml={5}>
                Login
              </Button>
            </div>
          )}
          <ActionIcon
            onClick={() => {
              setColorScheme(computedColorScheme === "dark" ? "light" : "dark");
            }}
          >
            {computedColorScheme === "dark" && <TbSunHigh />}
            {computedColorScheme === "light" && <TbMoon />}
          </ActionIcon>
        </Group>
      </Group>
    </>
  );
}

export default Header;
